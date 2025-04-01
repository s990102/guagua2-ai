
const path = require("path");
const fastify = require("fastify")({ logger: true });
const axios = require("axios");
require("dotenv").config();

fastify.register(require("@fastify/static"), {
  root: path.join(__dirname, "public"),
  prefix: "/",
});

fastify.register(require("@fastify/formbody"));
fastify.register(require("@fastify/view"), {
  engine: { handlebars: require("handlebars") },
});

const seo = require("./src/seo.json");
if (seo.url === "glitch-default") {
  seo.url = `https://${process.env.PROJECT_DOMAIN || "localhost"}`;
}

fastify.get("/", (request, reply) => {
  reply.view("/src/pages/index.hbs", { seo });
});

fastify.post("/chat", async (request, reply) => {
  const userMessage = request.body.message;
  const systemPrompt = `你是一位名叫瓜妹的AI，個性任性自信、可愛輕浮，愛插話、亂聊。請用瓜妹語氣回應：`;

  try {
    const response = await axios.post(
      "https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-alpha",
      {
        inputs: `${systemPrompt}
使用者：${userMessage}
瓜妹AI：`,
        parameters: { max_new_tokens: 100, temperature: 0.7, top_p: 0.9 }
      },
      { headers: { Authorization: `Bearer ${process.env.HF_API_KEY}` } }
    );

    const replyText = response.data.generated_text.split("瓜妹AI：")[1]?.trim() || "瓜妹走神了，再說一次？";
    reply.send({ reply: replyText });
  } catch (err) {
    console.error(err);
    reply.send({ reply: "瓜妹小當機了QQ 再試一次好嗎？" });
  }
});

fastify.listen({ port: process.env.PORT || 3000, host: "0.0.0.0" }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(\`Server listening at \${address}\`);
});
