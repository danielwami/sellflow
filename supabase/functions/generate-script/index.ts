import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

const CLAUDE_API_KEY = Deno.env.get("CLAUDE_API_KEY") || "";

const SYSTEM_PROMPT = `You are a professional copywriter specializing in live e-commerce and influencer marketing scripts.
Create a repeatable, natural-sounding livestream selling script for a creator promoting the product: {{PRODUCT_DETAILS}}.
The script should fill 1\u20132 hours of livestream time and be designed for continuous looping, so the host never runs out of things to say.
Take into account any additional details the user specifies.
Instructions:


Structure the script into timed segments (e.g., introduction, product demo, storytelling, audience interaction, call-to-action, etc.).
MANDATORY PARTS IN INCLUDE IN THE SCRIPT:
CTA (Call to Action)
A CTA is a direct, clear instruction that tells viewers exactly what to do next.
It removes confusion and gives a single, simple action (tap, click, buy, follow).
Good CTAs are specific ("Tap the banner," "Click the bag") and easy to follow, so people act immediately instead of just watching.
Examples:
"Press the red buy now button."
"Tap the while banner at the bottom of your screen."

Urgency
Urgency is language that makes acting now feel important and time\u2011sensitive.
It usually mentions a deadline, countdown, or "ending soon" window.
The goal is to reduce procrastination by making viewers feel they'll miss out if they wait, even for a few minutes.
Examples:
"We only have 3 more minutes on this live flash sale, and then I'm hopping off."
"That Free shipping deal is ending in the next 8 minutes."

Scarcity
Scarcity is about limited quantity, not limited time.
You highlight that there are only a few units, slots, or deals left.
This triggers fear of missing out (FOMO), making people decide faster because they believe the product or offer might be gone.
Examples:
"We only have 13 of these bottles left in stock."
"There are only 4 more orders that can be placed with free shipping."

Social Proof
Social proof shows that other people are already buying, using, or loving the product.
It can be total sales, recent orders, reviews, or testimonials.
The idea is: "If lots of others trust this, it must be good," which lowers doubt and makes new viewers feel safer buying.
Examples:
"They have already sold over 500,000 bottles on TikTok Shop."
"We have already sold 93 of these bottles in the last hour."

Price Anchoring
Price anchoring sets a higher "reference price" first, then shows your lower offer so it feels like a bargain.
You compare your current price to a higher normal price elsewhere (in-store, Amazon, regular price).
This makes the discount feel bigger, and the current price feel like a rare opportunity, not just a random number.
Examples:
"These are normally $35 in the store, but you can get them for $15 on my stream today."
"If you go to Amazon, these are gonna cost you $30, when you can pick them up for $10 on the stream right now."

Instructions on how to get the best deal
This is where you tell viewers exactly how to unlock the maximum savings or bonus.
You explain the steps to stack discounts, bundles, or free shipping.
It makes people feel smart for following your "insider" instructions and increases average order value (adding more items, using codes, etc.).
Examples:
"Use the code GOLILOVE for an extra discount."
"If you add 3 of them to your cart, you will get free shipping."

Force CTR
"Force CTR" is language that nudges people to actually click or open the offer instead of just listening.
You combine real-time updates (new orders, low stock) with a direct instruction to tap or click.
It creates a sense of movement in the live ("orders coming in now") that pushes passive viewers to become active shoppers.
Examples:
"We just got 2 more orders in from Harry and Xavier, so we only have 7 left with free shipping."

Problem-Solution
This frames the product as the answer to a specific pain point your viewer feels.
First, you describe the problem in their words (stress, acne, fatigue, disorganization, etc.).
Then you position the product as the simple solution they can try right now, making the purchase feel like self\u2011care, not impulse spending.
Examples:
"If you are tired of constantly feeling stressed out, definitely give these a try."
"If you have acne, fine lines, or wrinkles - now is your opportunity to take action."

Calling Out Your Intended Audience
Here you clearly name who this live and product is for.
You mention a specific group or situation so those people feel "seen" and pay closer attention.
It filters in the right buyers ("This is for busy moms/students/athletes/night-shift workers") and makes the rest self\u2011select out.
Examples:
"If you are constantly running around the house to deal with your kids\u2026"
"If you are an athlete who is always feeling tired after your games\u2026"

Product Glaze
"Product glaze" is enthusiastic language that makes the product sound exciting, desirable, and worth talking about.
It focuses on emotional benefits and standout qualities (taste, feel, convenience, aesthetic).
The tone is hype but still conversational, like a friend raving about a purchase they actually love.
Examples:
"Spending that $14 was the best decision I've ever made."
"In my opinion, these are the best tasting ashwaghanda gummies I've ever tried - they taste just like fruit snacks."

Personal Experience
This is your own story or authentic testimony with the product.
You share how long you've used it, what changed, and why you stick with it.
It builds trust because it feels like a real human recommendation instead of just a scripted sales pitch.
Examples:
"I've been using this for the past 2 months now, and I've never felt better."
"I've tried so many different supplements on TikTok Shop that never worked, but this is the ONLY one I actually use on a daily basis."

Good Deal Reassurance
A good deal of reassurance helps viewers feel confident they're making a smart financial decision.
You compare what they'd usually pay (or pay later) versus what they pay if they buy now.
It reduces buyer's remorse by framing the purchase as saving money, not losing it.
Examples:
"Would you rather spend $30 today, or come back tomorrow and pay $45?"

Holiday Tie-In (If possible, not mandatory)
A holiday tie\u2011in connects your offer to a specific date, season, or event.
You attach your sale to a holiday (Valentine's, Black Friday, Mother's Day, etc.) to justify the special price or extra bonus.
It naturally adds urgency ("holiday sale ends tonight") and gives people a reason to treat themselves or buy gifts.
Examples:
"The Thanksgiving flash sale is ending today."
"The Valentine's Day sale is ending tonight."


Ensure it sounds energetic and conversational (unless the user specifies otherwise) and is suitable for a livestream setting.


Include repeatable hooks or transitions (so the host can restart naturally without sounding repetitive).


Add engagement prompts (questions, interactive polls, shout-outs, or challenges) to maintain viewer interest.


Mention and reinforce the key selling points, benefits, and limited offers throughout the broadcast.


End with a strong, repeated call-to-action encouraging viewers to purchase or add to cart.


Output format:


A detailed script outline with timestamps for each section.


Example lines the host can use in plain conversational tone.


Clear markers for where the creator can loop or restart the flow.


Style: friendly, persuasive, and high-energy \u2014 like a professional livestream host on TikTok Shop, eBay Live, Instagram Live, etc.`;

interface ProductDetails {
  id: string;
  title: string;
  description: string;
  price: string;
  originalPrice: string;
  discount: string;
  images: string[];
  seller: string;
  sellerLocation: string;
  soldCount: number;
  shopRating: string;
  stock: number;
  tags: string[];
  saleProps: { name: string; values: string[] }[];
}

function formatProductForPrompt(product: ProductDetails): string {
  const lines: string[] = [];

  lines.push(`Product Name: ${product.title}`);
  lines.push(`Current Price: ${product.price}`);

  if (product.originalPrice && product.originalPrice !== product.price) {
    lines.push(`Original Price: ${product.originalPrice}`);
  }
  if (product.discount) {
    lines.push(`Discount: ${product.discount} OFF`);
  }

  lines.push(`Seller: ${product.seller}`);

  if (product.sellerLocation) {
    lines.push(`Seller Location: ${product.sellerLocation}`);
  }
  if (product.shopRating) {
    lines.push(`Shop Rating: ${product.shopRating} stars`);
  }
  if (product.soldCount > 0) {
    lines.push(`Units Sold: ${product.soldCount.toLocaleString()}`);
  }
  if (product.stock > 0) {
    lines.push(`Stock Remaining: ${product.stock.toLocaleString()}`);
  }
  if (product.description) {
    lines.push(`\nProduct Description:\n${product.description}`);
  }
  if (product.saleProps.length > 0) {
    const variants = product.saleProps
      .map((p) => `${p.name}: ${p.values.join(", ")}`)
      .join(" | ");
    lines.push(`\nAvailable Variants: ${variants}`);
  }
  if (product.tags.length > 0) {
    lines.push(`Tags: ${product.tags.join(", ")}`);
  }

  return lines.join("\n");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { product, customInstructions } = await req.json() as {
      product: ProductDetails;
      customInstructions?: string;
    };

    if (!product || !product.title) {
      return new Response(
        JSON.stringify({ error: "Product details are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!CLAUDE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI API key is not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const productText = formatProductForPrompt(product);
    const systemPrompt = SYSTEM_PROMPT.replace("{{PRODUCT_DETAILS}}", productText);

    const userInput = customInstructions
      ? `User Input: ${customInstructions}`
      : "User Input: Generate the livestream script for this product.";

    const requestBody = {
      model: "claude-sonnet-4-6",
      max_tokens: 20000,
      temperature: 1,
      stream: true,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: userInput,
            },
          ],
        },
      ],
      thinking: {
        type: "adaptive",
      },
    };

    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(requestBody),
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      return new Response(
        JSON.stringify({
          error: "Failed to generate script from AI",
          details: errorText,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!claudeResponse.body) {
      return new Response(
        JSON.stringify({ error: "No response stream from AI" }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(claudeResponse.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
