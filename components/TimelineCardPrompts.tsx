import React, { useCallback } from 'react';
import { Select } from '@radix-ui/themes';

// Make sure to export the arrays
export const fashionPrompts = [
    {
        "label": "Model wearing product (Studio)",
        "prompt": "A professional studio photo of a fashion model wearing the product provided in the separate images with a plain white background, front-facing, high detail."
    },
    {
        "label": "Outdoor fashion shoot",
        "prompt": "A fashion model wearing the product provided in the separate images in a stylish urban outdoor setting with natural lighting and dynamic pose."
    },
    {
        "label": "Runway look",
        "prompt": "High-fashion runway scene with a model confidently walking and wearing the product provided in the separate images, dramatic lighting, audience blurred in background."
    },
    {
        "label": "Street style",
        "prompt": "Casual street style photo of a model wearing the product provided in the separate images in a trendy city location, candid aesthetic."
    },
    {
        "label": "Minimalist fashion portrait",
        "prompt": "Close-up fashion portrait of a model wearing the product provided in the separate images, soft lighting, clean neutral background."
    },
    {
        "label": "Seasonal lookbook (Autumn)",
        "prompt": "Fashion model wearing the product provided in the separate images in an autumn outdoor setting with falling leaves, warm tones, editorial style."
    },
    {
        "label": "Luxury editorial",
        "prompt": "Luxury fashion editorial image of a model wearing the product provided in the separate images, dramatic lighting, moody atmosphere, Vogue-style."
    },
    {
        "label": "Sporty activewear scene",
        "prompt": "Athletic model wearing the product provided in the separate images in an energetic pose in a gym or outdoor fitness setting, sporty and dynamic."
    },
    {
        "label": "Casual indoor look",
        "prompt": "Model wearing the product provided in the separate images in a cozy indoor environment like a modern apartment, natural pose, lifestyle-oriented."
    },
    {
        "label": "Festival outfit",
        "prompt": "Model wearing the product provided in the separate images at a music festival scene, boho or eclectic style, vibrant colors, outdoor daytime lighting."
    }
];

// Generic Product / Lifestyle Prompts
export const genericPrompts = [
    {
        "label": "Product on white background",
        "prompt": "High-resolution image of the product on a clean white background, isolated, centered, perfect lighting."
    },
    {
        "label": "Product in home setting",
        "prompt": "The product placed naturally in a cozy modern home interior, styled on a shelf or table."
    },
    {
        "label": "Lifestyle use scene",
        "prompt": "A person using the product in a real-world context, natural lighting, candid and friendly atmosphere."
    },
    {
        "label": "Luxury flat lay",
        "prompt": "Stylized flat lay of the product surrounded by complementary items on a marble or wooden surface, elegant lighting."
    },
    {
        "label": "Outdoor adventure setup",
        "prompt": "The product being used in an outdoor adventure setting, like hiking, camping, or travel, natural environment."
    },
    {
        "label": "Work desk setup",
        "prompt": "The product as part of a neatly organized work desk scene, clean and professional, modern office aesthetic."
    },
    {
        "label": "Holiday gift display",
        "prompt": "The product wrapped or unwrapped in a festive holiday scene with decorations and warm lighting."
    },
    {
        "label": "Eco-friendly lifestyle scene",
        "prompt": "The product in an eco-conscious setting, like reusable items on a kitchen counter with plants and natural textures."
    },
    {
        "label": "Kitchen usage scene",
        "prompt": "The product being used in a stylish kitchen, mid-action with natural ingredients and homey lighting."
    },
    {
        "label": "Pet or child interaction",
        "prompt": "A pet or child interacting with the product in a joyful and safe environment, home or park setting."
    }
];

// Fun & Creative Image Prompts
export const funPrompts = [
    {
        label: "Futuristic city skyline",
        prompt: "A futuristic city skyline at sunset, in vibrant neon colors"
    },
    {
        label: "Wizard cat in magical library",
        prompt: "A whimsical cat wearing a wizard hat, casting spells in a magical library"
    },
    {
        label: "Serene mountain landscape",
        prompt: "A serene mountain landscape with a crystal-clear lake and pine trees"
    },
    {
        label: "Robot gardener at night",
        prompt: "A robot gardener tending to glowing flowers in a moonlit garden"
    },
    {
        label: "Steampunk airship",
        prompt: "A steampunk airship floating above the clouds, with gears and propellers"
    },
    {
        label: "Playful panda in jungle",
        prompt: "A playful panda eating bamboo in a lush, cartoon-style jungle"
    },
    {
        label: "Cozy snowy cabin",
        prompt: "A cozy cabin in the snowy woods, smoke curling from the chimney"
    },
    {
        label: "Dragon over ruins",
        prompt: "A majestic dragon soaring over ancient ruins at dawn"
    },
    {
        label: "Penguin snowball fight",
        prompt: "A group of penguins having a snowball fight on an icy plain"
    },
    {
        label: "Retro diner with animals",
        prompt: "A retro diner scene with anthropomorphic animals enjoying milkshakes"
    },
    {
        label: "Cartoon fox in the forest",
        prompt: "A cartoon looking fox in the forest"
    }
];

interface TimelineCardPromptsProps {
    onPromptSelected: (prompt: string) => void;
}

export const TimelineCardPrompts: React.FC<TimelineCardPromptsProps> = ({ onPromptSelected }) => {
    const handlePromptSelect = useCallback((value: string) => {
        // Find the prompt that matches the selected value
        const allPrompts = [...fashionPrompts, ...genericPrompts, ...funPrompts];
        const selectedItem = allPrompts.find(item => item.label === value);

        if (selectedItem) {
            onPromptSelected(selectedItem.prompt);
        }
    }, [onPromptSelected]);

    return (
        <Select.Root onValueChange={handlePromptSelect}>
            <Select.Trigger placeholder="Select a prompt template" />
            <Select.Content position="popper">
                <Select.Group>
                    <Select.Label>
                        Fashion prompts
                    </Select.Label>

                    {fashionPrompts.map((item, index) => (
                        <Select.Item key={`fashion-${index}`} value={item.label}>
                            {item.label}
                        </Select.Item>
                    ))}
                </Select.Group>

                <Select.Separator />

                <Select.Group>
                    <Select.Label>
                        Generic prompts
                    </Select.Label>

                    {genericPrompts.map((item, index) => (
                        <Select.Item key={`generic-${index}`} value={item.label}>
                            {item.label}
                        </Select.Item>
                    ))}
                </Select.Group>

                <Select.Separator />

                <Select.Group>
                    <Select.Label>
                        Fun & Creative prompts
                    </Select.Label>

                    {funPrompts.map((item, index) => (
                        <Select.Item key={`fun-${index}`} value={item.label}>
                            {item.label}
                        </Select.Item>
                    ))}
                </Select.Group>
            </Select.Content>
        </Select.Root>
    );
};