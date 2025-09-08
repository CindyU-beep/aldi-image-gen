import React, { useCallback } from 'react';
import { Select } from '@radix-ui/themes';

// ALDI Nord Product Photography Prompts
export const productPrompts = [
    {
        "label": "Product hero shot (White background)",
        "prompt": "Professional product photography of the grocery item on a clean white background, centered, well-lit, high resolution, perfect for retail catalog use, ALDI Nord brand standards."
    },
    {
        "label": "Fresh produce display",
        "prompt": "Fresh produce artfully arranged in a modern grocery display, vibrant colors, natural lighting, emphasizing freshness and quality, ALDI Nord style."
    },
    {
        "label": "Recipe ingredients layout",
        "prompt": "Ingredients for a delicious recipe laid out on a wooden cutting board or marble countertop, styled for cooking inspiration, warm natural lighting."
    },
    {
        "label": "Family meal scene",
        "prompt": "Family gathered around a dinner table enjoying a meal made with ALDI products, warm atmosphere, natural lighting, authentic family moments."
    },
    {
        "label": "Kitchen prep scene",
        "prompt": "Modern kitchen with the product being prepared or used in cooking, clean and organized space, natural lighting, lifestyle photography style."
    },
    {
        "label": "Grocery basket composition",
        "prompt": "Shopping basket or reusable bag filled with ALDI products, emphasizing variety and value, clean background, perfect for promotional materials."
    },
    {
        "label": "Product in pantry/fridge",
        "prompt": "Product naturally placed in a well-organized pantry or refrigerator, showing how it fits into everyday life, clean and modern storage."
    },
    {
        "label": "Seasonal product display",
        "prompt": "Product featured in a seasonal context (holiday baking, summer BBQ, etc.), appropriate props and decorations, festive atmosphere."
    },
    {
        "label": "Health & wellness focus",
        "prompt": "Product positioned with fitness equipment, fresh ingredients, or wellness props, emphasizing healthy lifestyle choices."
    },
    {
        "label": "Value comparison shot",
        "prompt": "Product prominently displayed with price tags or value indicators, clean commercial photography style, emphasizing ALDI's value proposition."
    }
];

// ALDI Nord Lifestyle & Campaign Prompts
export const lifestylePrompts = [
    {
        "label": "Weekly shopping trip",
        "prompt": "Happy customer with shopping cart full of ALDI products in a modern, clean grocery store setting, natural lighting, authentic shopping experience."
    },
    {
        "label": "Meal planning session",
        "prompt": "Person planning weekly meals with ALDI products spread on kitchen counter, notebook and pen visible, organized and efficient lifestyle."
    },
    {
        "label": "Quick weeknight dinner",
        "prompt": "Busy parent preparing a quick, healthy dinner using ALDI ingredients, modern kitchen, warm lighting, family-friendly atmosphere."
    },
    {
        "label": "Special occasion cooking",
        "prompt": "Elegant dinner party or holiday meal preparation using premium ALDI products, sophisticated kitchen setting, warm ambient lighting."
    },
    {
        "label": "Student budget meal",
        "prompt": "Young person creating an affordable, nutritious meal with ALDI products in a small apartment kitchen, budget-conscious lifestyle."
    },
    {
        "label": "Outdoor picnic/BBQ",
        "prompt": "Family or friends enjoying outdoor dining with ALDI products, picnic table or BBQ setting, summer atmosphere, social gathering."
    },
    {
        "label": "Lunch prep for work",
        "prompt": "Professional preparing healthy work lunches using ALDI ingredients, meal prep containers, efficient morning routine."
    },
    {
        "label": "Cozy breakfast scene",
        "prompt": "Warm breakfast scene with ALDI products on a wooden table, morning light streaming through window, homey atmosphere."
    },
    {
        "label": "Sustainable shopping",
        "prompt": "Environmentally conscious shopper with reusable bags and sustainable ALDI products, green lifestyle, eco-friendly choices."
    },
    {
        "label": "Entertaining guests",
        "prompt": "Host preparing appetizers or entertaining spread using ALDI special buys and premium products, elegant presentation."
    }
];

// ALDI Nord Marketing & Promotional Prompts
export const marketingPrompts = [
    {
        "label": "Weekly Special Buys feature",
        "prompt": "Eye-catching promotional display of ALDI Special Buys products with price tags and 'Limited Time' messaging, retail advertising style."
    },
    {
        "label": "Fresh produce promotion",
        "prompt": "Vibrant display of fresh fruits and vegetables with promotional pricing, emphasizing quality and freshness, grocery store lighting."
    },
    {
        "label": "German quality heritage",
        "prompt": "Premium German-imported products displayed with subtle German flag colors or European countryside backdrop, emphasizing authentic quality."
    },
    {
        "label": "Price comparison visual",
        "prompt": "Side-by-side comparison showing ALDI products with competitor pricing, clean infographic style, emphasizing value savings."
    },
    {
        "label": "Store opening announcement",
        "prompt": "New ALDI store exterior with grand opening banners and happy customers, bright daylight, community celebration atmosphere."
    },
    {
        "label": "Digital coupon feature",
        "prompt": "Mobile phone displaying ALDI app with digital coupons, surrounded by the featured products, modern tech-savvy shopping."
    },
    {
        "label": "Seasonal campaign hero",
        "prompt": "Seasonal products arranged for holiday campaign (Christmas baking, summer grilling, back-to-school), festive and promotional."
    },
    {
        "label": "Corporate social responsibility",
        "prompt": "ALDI supporting local community, food donation, sustainability initiatives, authentic documentary-style photography."
    },
    {
        "label": "Employee spotlight",
        "prompt": "Friendly ALDI team member in uniform helping customers or arranging products, professional retail environment, authentic workplace."
    },
    {
        "label": "Brand promise visualization",
        "prompt": "Visual representation of ALDI's key promises: quality, value, simplicity - clean, modern composition with products and messaging."
    }
];

interface TimelineCardPromptsProps {
    onPromptSelected: (prompt: string) => void;
}

export const TimelineCardPrompts: React.FC<TimelineCardPromptsProps> = ({ onPromptSelected }) => {
    const handlePromptSelect = useCallback((value: string) => {
        // Find the prompt that matches the selected value
        const allPrompts = [...productPrompts, ...lifestylePrompts, ...marketingPrompts];
        const selectedItem = allPrompts.find(item => item.label === value);

        if (selectedItem) {
            onPromptSelected(selectedItem.prompt);
        }
    }, [onPromptSelected]);

    return (
        <Select.Root onValueChange={handlePromptSelect}>
            <Select.Trigger placeholder="Select an ALDI Nord prompt template" />
            <Select.Content position="popper">
                <Select.Group>
                    <Select.Label>
                        Product Photography
                    </Select.Label>

                    {productPrompts.map((item, index) => (
                        <Select.Item key={`product-${index}`} value={item.label}>
                            {item.label}
                        </Select.Item>
                    ))}
                </Select.Group>

                <Select.Separator />

                <Select.Group>
                    <Select.Label>
                        Lifestyle & Campaigns
                    </Select.Label>

                    {lifestylePrompts.map((item, index) => (
                        <Select.Item key={`lifestyle-${index}`} value={item.label}>
                            {item.label}
                        </Select.Item>
                    ))}
                </Select.Group>

                <Select.Separator />

                <Select.Group>
                    <Select.Label>
                        Marketing & Promotions
                    </Select.Label>

                    {marketingPrompts.map((item, index) => (
                        <Select.Item key={`marketing-${index}`} value={item.label}>
                            {item.label}
                        </Select.Item>
                    ))}
                </Select.Group>
            </Select.Content>
        </Select.Root>
    );
};