import type { NextApiRequest, NextApiResponse } from 'next';

interface ComplianceCriteria {
    name: string;
    score: number;
    status: 'compliant' | 'warning' | 'non-compliant';
    feedback: string;
}

interface ComplianceResponse {
    overall_score: number;
    overall_status: 'compliant' | 'warning' | 'non-compliant';
    criteria: ComplianceCriteria[];
    summary: string;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method === 'GET') {
        return res.status(200).json({
            status: 'healthy',
            service: 'Brand Compliance API',
            version: '1.0.0'
        });
    }

    if (req.method !== 'POST') {
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const startTime = Date.now();
        const { imageUrl } = req.body;

        console.log(`Starting brand compliance analysis for: ${imageUrl}`);

        const OPENAI_ENDPOINT = process.env.AZURE_OPENAI_4o_ENDPOINT;
        const OPENAI_API_DEPLOYMENT_NAME = process.env.AZURE_OPENAI_4o_API_DEPLOYMENT_NAME;
        const OPENAI_API_VERSION = process.env.AZURE_OPENAI_4o_API_VERSION;
        const OPENAI_API_KEY = process.env.AZURE_OPENAI_4o_API_KEY;

        if (!OPENAI_API_KEY) {
            return res.status(500).json({ error: "API key not configured" });
        }

        if (!imageUrl) {
            return res.status(400).json({ error: "Image URL is required" });
        }

        const compliancePrompt = `Analyze this image for ALDI Nord brand compliance. Evaluate:

1. Logo Placement & Visibility (40% weight)
2. Message Tone & Language (40% weight) 
3. Legal Adherence & GDPR Compliance (20% weight)

Respond with valid JSON only:
{
  "overall_score": 85,
  "overall_status": "compliant",
  "criteria": [
    {
      "name": "Logo Placement & Visibility",
      "score": 90,
      "status": "compliant",
      "feedback": "Logo is clearly visible and properly positioned"
    },
    {
      "name": "Message Tone & Language",
      "score": 85,
      "status": "compliant", 
      "feedback": "Professional tone aligns with ALDI brand voice"
    },
    {
      "name": "Legal Adherence & GDPR Compliance",
      "score": 80,
      "status": "warning",
      "feedback": "Consider adding privacy disclaimer"
    }
  ],
  "summary": "Good compliance with minor recommendations"
}`;

        const endpoint = `${OPENAI_ENDPOINT}openai/deployments/${OPENAI_API_DEPLOYMENT_NAME}/chat/completions?api-version=${OPENAI_API_VERSION}`;

        let imageContent;
        try {
            const absoluteUrl = imageUrl.startsWith('/') 
                ? `${req.headers.host ? `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}` : 'http://localhost:3000'}${imageUrl}`
                : imageUrl;
            
            const imageResponse = await fetch(absoluteUrl);
            if (!imageResponse.ok) {
                throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
            }

            const imageBlob = await imageResponse.blob();
            const arrayBuffer = await imageBlob.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            imageContent = `data:${imageBlob.type};base64,${buffer.toString('base64')}`;
        } catch (error) {
            console.error("Error processing image:", error);
            return res.status(400).json({
                error: "Failed to process image",
                details: error instanceof Error ? error.message : String(error)
            });
        }

        const payload = {
            messages: [
                {
                    role: "system",
                    content: "You are a brand compliance expert. Analyze images for ALDI brand guidelines and respond with valid JSON only."
                },
                {
                    role: "user",
                    content: [
                        { type: "text", text: compliancePrompt },
                        {
                            type: "image_url",
                            image_url: { url: imageContent }
                        }
                    ]
                }
            ],
            temperature: 0.3,
            max_tokens: 1000
        };

        const maxRetries = 3;
        const baseDelay = 1000;
        let lastError;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`API attempt ${attempt}/${maxRetries}`);
                
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'api-key': OPENAI_API_KEY
                    },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    const data = await response.json();
                    let complianceContent = data.choices[0].message.content;

                    let parsedCompliance: ComplianceResponse;
                    try {
                        complianceContent = complianceContent.trim();
                        
                        if (complianceContent.startsWith('```json')) {
                            complianceContent = complianceContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
                        } else if (complianceContent.startsWith('```')) {
                            complianceContent = complianceContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
                        }
                        
                        parsedCompliance = JSON.parse(complianceContent);
                        
                        if (typeof parsedCompliance.overall_score !== 'number' || 
                            !Array.isArray(parsedCompliance.criteria)) {
                            throw new Error("Invalid response structure");
                        }

                        parsedCompliance.overall_score = Math.min(100, Math.max(0, parsedCompliance.overall_score));
                        
                        parsedCompliance.criteria = parsedCompliance.criteria.map(criterion => ({
                            ...criterion,
                            score: Math.min(100, Math.max(0, criterion.score || 0))
                        }));

                        if (!['compliant', 'warning', 'non-compliant'].includes(parsedCompliance.overall_status)) {
                            if (parsedCompliance.overall_score >= 90) {
                                parsedCompliance.overall_status = 'compliant';
                            } else if (parsedCompliance.overall_score >= 70) {
                                parsedCompliance.overall_status = 'warning';
                            } else {
                                parsedCompliance.overall_status = 'non-compliant';
                            }
                        }

                        parsedCompliance.criteria = parsedCompliance.criteria.map(criterion => {
                            if (!['compliant', 'warning', 'non-compliant'].includes(criterion.status)) {
                                if (criterion.score >= 90) {
                                    criterion.status = 'compliant';
                                } else if (criterion.score >= 70) {
                                    criterion.status = 'warning';
                                } else {
                                    criterion.status = 'non-compliant';
                                }
                            }
                            return criterion;
                        });

                        if (!parsedCompliance.summary) {
                            parsedCompliance.summary = `Overall compliance score: ${parsedCompliance.overall_score}%.`;
                        }

                    } catch (parseError) {
                        console.error("Failed to parse response:", parseError);
                        
                        parsedCompliance = {
                            overall_score: 50,
                            overall_status: 'warning',
                            criteria: [
                                {
                                    name: "Logo Placement & Visibility",
                                    score: 50,
                                    status: 'warning',
                                    feedback: "Analysis failed - please try again"
                                },
                                {
                                    name: "Message Tone & Language",
                                    score: 50,
                                    status: 'warning',
                                    feedback: "Analysis failed - please try again"
                                },
                                {
                                    name: "Legal Adherence & GDPR Compliance",
                                    score: 50,
                                    status: 'warning',
                                    feedback: "Analysis failed - please try again"
                                }
                            ],
                            summary: "Analysis could not be completed. Please try again."
                        };
                    }

                    const endTime = Date.now();
                    const analysisTime = endTime - startTime;
                    console.log(`Analysis completed in ${analysisTime}ms, score: ${parsedCompliance.overall_score}%`);

                    return res.status(200).json({
                        compliance: parsedCompliance,
                        metadata: {
                            analysis_time_ms: analysisTime,
                            timestamp: new Date().toISOString()
                        }
                    });
                }

                const errorData = await response.json();
                lastError = errorData;

                if (response.status === 503 || response.status === 502 || response.status === 429) {
                    console.warn(`Retryable error on attempt ${attempt}: ${response.status}`);
                    
                    if (attempt < maxRetries) {
                        const delay = baseDelay * Math.pow(2, attempt - 1);
                        console.log(`Waiting ${delay}ms before retry...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        continue;
                    }
                } else {
                    console.error(`Non-retryable error: ${response.status}`, errorData);
                    break;
                }

            } catch (fetchError) {
                console.error(`Network error on attempt ${attempt}:`, fetchError);
                lastError = { error: { message: fetchError instanceof Error ? fetchError.message : 'Network error' } };
                
                if (attempt < maxRetries) {
                    const delay = baseDelay * Math.pow(2, attempt - 1);
                    console.log(`Waiting ${delay}ms before retry...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
            }
        }

        console.error(`All ${maxRetries} attempts failed. Last error:`, lastError);
        
        return res.status(503).json({
            error: "Brand compliance service temporarily unavailable",
            details: "Azure OpenAI service is experiencing issues. Please try again in a few minutes.",
            service_error: lastError,
            retry_count: maxRetries
        });

    } catch (error) {
        console.error("Error analyzing brand compliance:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);

        return res.status(500).json({
            error: "Failed to analyze brand compliance",
            details: errorMessage
        });
    }
}