import { NextRequest, NextResponse } from 'next/server';

type HeyGenResponseData = {
    data?: {
        token?: string;
    };
    error?: string;
};

export default async function POST(request: NextRequest) {
    try {

        const HEYGEN_API_KEY = process.env.NEXT_PUBLIC_HEYGEN_API_KEY;

        if (!HEYGEN_API_KEY) {
            console.error("API key is missing");
            throw new Error("HEYGEN_API_KEY is missing from environment variables");
        }

        console.log("Making request to HeyGen API...");

        const response = await fetch("https://api.heygen.com/v1/streaming.create_token", {
            method: "POST",
            headers: {
                "accept": "application/json",
                "content-type": "application/json",
                "x-api-key": HEYGEN_API_KEY
            }
        });

        // Спочатку отримуємо текст відповіді
        const responseText = await response.text();

        console.log("Response status:", response.status);
        console.log("Response headers:", Object.fromEntries(response.headers));
        console.log("Response body:", responseText);

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }


        if (!responseText) {
            throw new Error("Empty response from API");
        }


        const data = JSON.parse(responseText) as HeyGenResponseData;

        if (!data.data?.token) {
            throw new Error("No token in response");
        }

        return new Response(data.data.token, {
            status: 200,
            headers: {
                "Content-Type": "text/plain",
            },
        });

    } catch (error: unknown) {

        const typedError = error as Error;

        console.error("Error details:", {
            message: typedError.message,
            stack: typedError.stack,
        });

        return new Response(
            JSON.stringify({ error: typedError.message }),
            {
                status: 500,
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
    }
}