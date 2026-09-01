import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SCRAPE_CREATORS_API_KEY = Deno.env.get("SCRAPE_CREATORS_API_KEY") || "";

function extractImages(productBase: Record<string, unknown>): string[] {
  const images: string[] = [];
  const imgArray = productBase.images;
  if (Array.isArray(imgArray)) {
    for (const img of imgArray) {
      if (img && typeof img === "object") {
        const urlList = (img as Record<string, unknown>).url_list;
        if (Array.isArray(urlList) && urlList.length > 0) {
          images.push(String(urlList[0]));
        }
      }
    }
  }
  return images;
}

function extractSaleProps(
  saleProps: unknown[]
): { name: string; values: string[] }[] {
  if (!Array.isArray(saleProps)) return [];
  return saleProps.map(
    (p: unknown) => {
      const prop = p as Record<string, unknown>;
      const values = Array.isArray(prop.sale_prop_values)
        ? prop.sale_prop_values.map(
            (v: unknown) => String((v as Record<string, unknown>).prop_value || "")
          )
        : [];
      return { name: String(prop.prop_name || ""), values };
    }
  );
}

function extractPriceInfo(productBase: Record<string, unknown>, productInfo: Record<string, unknown>): Record<string, unknown> {
  const price = (productBase.price || {}) as Record<string, unknown>;

  const priceInfo = (productInfo as Record<string, unknown>).product_price_info as Record<string, unknown> | undefined;
  if (priceInfo) {
    return {
      real_price: priceInfo.sale_price_format
        ? `${priceInfo.currency_symbol || "$"}${priceInfo.sale_price_format}`
        : price.real_price || "",
      original_price: priceInfo.origin_price_format
        ? `${priceInfo.currency_symbol || "$"}${priceInfo.origin_price_format}`
        : price.original_price || "",
      discount: priceInfo.discount_format
        ? `-${priceInfo.discount_format}`
        : price.discount || "",
    };
  }

  return price;
}

async function fetchWithRetry(url: string, headers: Record<string, string>, maxRetries = 2): Promise<Response> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, { method: "GET", headers });
      if (response.status === 500 && attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      return response;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }
  throw lastError || new Error("Failed after retries");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return new Response(
        JSON.stringify({ error: "Please provide a valid TikTok product URL" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!SCRAPE_CREATORS_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Scrape Creators API key is not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const cleanUrl = url.trim();

    const apiUrl = `https://api.scrapecreators.com/v1/tiktok/product?url=${encodeURIComponent(cleanUrl)}&get_related_videos=false&region=US`;

    const response = await fetchWithRetry(apiUrl, {
      "x-api-key": SCRAPE_CREATORS_API_KEY,
      "Content-Type": "application/json",
    });

    const responseText = await response.text();

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: `Scrape Creators API error: ${response.status}`,
          details: responseText.substring(0, 500),
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(responseText);
    } catch {
      return new Response(
        JSON.stringify({
          error: "Invalid response from scraping API",
          details: responseText.substring(0, 500),
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const productInfo = (data.product_info || data.data || data) as Record<string, unknown>;

    const productBase = (productInfo.product_base || productInfo) as Record<string, unknown>;
    const seller = (productInfo.seller || {}) as Record<string, unknown>;
    const shopInfo = (data.shop_info || {}) as Record<string, unknown>;
    const priceData = extractPriceInfo(productBase, productInfo);

    const title = productBase.title || productInfo.title || "";
    if (!title) {
      return new Response(
        JSON.stringify({
          error: "Product not found or invalid response",
          debug_keys: Object.keys(data),
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const images = extractImages(productBase);

    const soldInfo = (productInfo as Record<string, unknown>).sold_info as Record<string, unknown> | undefined;
    const rateInfo = (productInfo as Record<string, unknown>).rate_info as Record<string, unknown> | undefined;

    const product = {
      id: String(productInfo.product_id || productBase.product_id || ""),
      title: String(title),
      description: String(productBase.description || productInfo.description || ""),
      price: String(priceData.real_price || priceData.original_price || (productBase as Record<string, unknown>).price_str || "N/A"),
      originalPrice: String(priceData.original_price || ""),
      discount: String(priceData.discount || ""),
      images,
      seller: String(seller.name || shopInfo.shop_name || "Unknown Seller"),
      sellerLocation: String(seller.seller_location || ""),
      soldCount: Number(soldInfo?.sold_count || productBase.sold_count || 0),
      shopRating: String(rateInfo?.score || shopInfo.shop_rating || ""),
      stock:
        Array.isArray(productInfo.skus) && productInfo.skus.length > 0
          ? Number((productInfo.skus[0] as Record<string, unknown>).stock || 0)
          : 0,
      tags: [],
      saleProps: extractSaleProps(productInfo.sale_props as unknown[]),
    };

    return new Response(JSON.stringify({ success: true, product }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
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
