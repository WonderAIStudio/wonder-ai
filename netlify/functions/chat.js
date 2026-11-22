
export default async (req) => {
  if (req.method !== "POST") {
    return Response.json(
      { error: "Only POST requests are allowed." },
      { status: 405 }
    );
  }

  try {
    const body = await req.json();

    if (!Array.isArray(body.messages)) {
      return Response.json(
        { error: "Please provide a messages array." },
        { status: 400 }
      );
    }

    const messages = body.messages
      .filter(
        (m) =>
          m &&
          ["user", "assistant"].includes(m.role) &&
          typeof m.content === "string"
      )
      .slice(-10)
      .map((m) => ({
        role: m.role,
        content: m.content.slice(0, 4000)
      }));

    if (!messages.length) {
      return Response.json(
        { error: "Please enter a message." },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const baseUrl = process.env.OPENAI_BASE_URL;

    if (!apiKey || !baseUrl) {
      return Response.json(
        { error: "Netlify AI Gateway is not available." },
        { status: 503 }
      );
    }

    const response = await fetch(
      `${baseUrl}/v1/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are WONDER AI, a helpful, respectful and educational assistant. Give clear, accurate and safe answers."
            },
            ...messages
          ],
          max_tokens: 400
        })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return Response.json(
        { error: "The AI service could not complete your request." },
        { status: 502 }
      );
    }

    const reply =
      result.choices?.[0]?.message?.content;

    if (!reply) {
      return Response.json(
        { error: "The AI returned an empty response." },
        { status: 502 }
      );
    }

    return Response.json({
      success: true,
      reply,
      model: result.model
    });

  } catch (error) {
    return Response.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
};
      
