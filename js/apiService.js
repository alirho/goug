export async function streamGeminiResponse(apiKey, history, userInput, onChunk) {
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?key=${apiKey}`;

    const contents = history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }],
    }));
    contents.push({
        role: 'user',
        parts: [{ text: userInput }],
    });

    const requestBody = {
        contents: contents,
        systemInstruction: {
            parts: [{ text: 'You are a helpful assistant named Goug. Your responses should be in Persian.' }]
        }
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
        }

        // Gemini API به صورت stream نمی‌فرستد، بلکه یکجا می‌فرستد
        // پس تمام متن را می‌خوانیم
        const text = await response.text();

        // پاسخ یک آرایه JSON است: [{...}]
        try {
            const jsonArray = JSON.parse(text);
            
            // اگر آرایه است
            if (Array.isArray(jsonArray)) {
                for (const item of jsonArray) {
                    const content = item.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (content) {
                        // برای simulate کردن streaming، متن را کاراکتر به کاراکتر می‌فرستیم
                        // یا اگر نمی‌خواهید این کار را کند، یکجا بفرستید
                        onChunk(content);
                    }
                }
            } else {
                // اگر object است
                const content = jsonArray.candidates?.[0]?.content?.parts?.[0]?.text;
                if (content) {
                    onChunk(content);
                }
            }
        } catch (parseError) {
            console.error("خطا در پارس JSON:", parseError);
            throw new Error('پاسخ نامعتبر از API');
        }

    } catch (error) {
        console.error("Error communicating with Gemini API:", error);
        throw error;
    }
}
