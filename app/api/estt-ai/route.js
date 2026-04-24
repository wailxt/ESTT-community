import { NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';
import {
    ESTT_AI_MODEL,
    ESTT_AI_SYSTEM_INSTRUCTION,
} from '@/lib/estt-ai';
import { searchResourcesAction } from '@/lib/resourceUtils';

export const dynamic = 'force-dynamic';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

function extractAiResponse(text) {
    if (!text) return { reply: null, action: null };

    try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const rawJson = jsonMatch[0];
            const actionData = JSON.parse(rawJson);
            const reply = text.replace(rawJson, '').trim();
            
            return {
                reply: reply || actionData.message || null,
                action: actionData
            };
        }
    } catch (e) {
        console.warn('AI returned malformed JSON or plain text.');
    }

    return { reply: text, action: null };
}

async function callGroq(messages, systemInstruction) {
    try {
        console.log(`📡 [ESTT-AI] Calling Groq with model: ${ESTT_AI_MODEL}`);
        
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemInstruction },
                ...messages
            ],
            model: ESTT_AI_MODEL,
            temperature: 1,
            max_completion_tokens: 1024,
            top_p: 1,
            stream: true,
            compound_custom: {
                tools: {
                    enabled_tools: [
                        "web_search",
                        "code_interpreter",
                        "visit_website"
                    ]
                }
            }
        });

        let fullContent = '';
        for await (const chunk of chatCompletion) {
            fullContent += chunk.choices[0]?.delta?.content || '';
        }
        
        if (!fullContent && !messages.some(m => m.role === 'assistant')) {
            throw new Error('Groq returned an empty response. This might be due to tool execution failure or safety filters.');
        }
        
        return fullContent;
    } catch (error) {
        console.error(`🚨 [Groq API Error]:`, {
            message: error.message,
            status: error.status,
            name: error.name,
            code: error.code
        });

        if (error.status === 401) throw new Error('Invalid Groq API Key. Please verify your .env.local configuration.');
        if (error.status === 429) throw new Error('Groq Rate Limit reached. Please wait a moment before trying again.');
        if (error.status === 404) throw new Error(`Model "${ESTT_AI_MODEL}" not found. Verify the model name in lib/estt-ai.js.`);
        if (error.status === 400) throw new Error(`Bad Request: ${error.message}`);
        
        throw new Error(`Groq API Error: ${error.message}`);
    }
}

export async function POST(request) {
    try {
        if (!process.env.GROQ_API_KEY) {
            return NextResponse.json({ error: 'GROQ_API_KEY missing' }, { status: 500 });
        }

        const { message, history = [], userProfile = null } = await request.json();
        
        // Prepare formatted history for Groq (role must be 'user' or 'assistant')
        const formattedHistory = Array.isArray(history) 
            ? history
                .filter((item) => item && (item.content || item.text))
                .slice(-12)
                .map((item) => ({
                    role: item.role === 'assistant' || item.role === 'model' ? 'assistant' : 'user',
                    content: item.content || item.text || "",
                }))
            : [];

        const messages = [...formattedHistory, { role: 'user', content: message?.trim() || "" }];

        const userContext = [
            userProfile?.firstName ? `First name: ${userProfile.firstName}` : null,
            userProfile?.lastName ? `Last name: ${userProfile.lastName}` : null,
            userProfile?.filiere ? `Field: ${userProfile.filiere}` : null,
        ].filter(Boolean).join('\n');

        const systemInstruction = userContext 
            ? `${ESTT_AI_SYSTEM_INSTRUCTION}\n\nCurrent user context:\n${userContext}` 
            : ESTT_AI_SYSTEM_INSTRUCTION;

        // Phase 1: Call Groq
        console.log(`🤖 [ESTT-AI] Phase 1 START`);
        const text = await callGroq(messages, systemInstruction);
        const { reply, action } = extractAiResponse(text);

        // Check if we need to perform a search (Phase 2 & 3)
        if (action?.action === 'read' && action?.target === 'resources') {
            console.log(`📡 [ESTT-AI] Phase 2: Server-side search for "${action.query}"`);
            const searchResults = await searchResourcesAction(action.query, userProfile?.filiere);
            
            console.log(`📥 [ESTT-AI] Found ${searchResults.length} resources. Starting Phase 3...`);
            
            const systemResultsMessage = {
                role: 'user',
                content: `[SYSTEM DATA FETCH RESULTS]\nQuery: "${action.query}"\nFound: ${JSON.stringify(searchResults.map(r => ({id: r.id, title: r.title, description: r.description})))}\n\nTASK: Recommend 2-5 resources using "display_resources" action.`
            };

            const finalText = await callGroq([...messages, { role: 'assistant', content: text || "Searching..." }, systemResultsMessage], systemInstruction);
            const final = extractAiResponse(finalText);

            console.log(`✅ [ESTT-AI] Pipeline COMPLETE`);
            return NextResponse.json({
                reply: final.reply,
                action: final.action,
                interimReply: reply,
                model: ESTT_AI_MODEL,
            });
        }

        console.log(`✅ [ESTT-AI] Single-turn COMPLETE`);
        return NextResponse.json({
            reply,
            action,
            model: ESTT_AI_MODEL,
        });

    } catch (error) {
        console.error('❌ ESTT-AI Route Error:', error);
        
        // Provide more descriptive errors to the frontend
        const errorMessage = error.message || 'An unexpected error occurred in the AI assistant.';
        const status = error.status || 500;
        
        return NextResponse.json({ 
            error: errorMessage,
            details: error.name !== 'Error' ? error.name : undefined,
            code: error.code
        }, { status });
    }
}
