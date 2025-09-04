import { Box, Card, Flex, Select, Text, Button, IconButton, Tooltip } from '@radix-ui/themes';
import { IconArrowBarBoth, IconCpu, IconPhotoX, IconSparkles, IconFile, IconRuler, IconCopy, IconUserScan, IconBackground, IconPhotoAi } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import useStore from '../lib/store';
import Compare from './Compare';
import { toast } from 'react-toastify';

export default function Toolbar() {
    const storeSettings = useStore(state => state.settings);
    const setSettings = useStore(state => state.setSettings);
    const compareImages = useStore(state => state.compare);
    const clearCompare = useStore(state => state.clearCompare);
    const [compareOpen, setCompareOpen] = useState(false);

    const gptOptions = {
        format: ["png", "jpg"],
        size: ["1024x1024", "1024x1536", "1536x1024"],
        quality: ["Low", "Medium", "High"],
        fidelity: ["Low", "High"],
        background: ["Auto", "Transparent", "Opaque"],
        variations: ["1", "2", "3", "4"]
    };

    const geminiOptions = {
        engine: ["Imagen 3", "Imagen 4", "Imagen 4 Ultra", "Flash Image (Nano Banana)"],
        format: ["png"],
        size: ["1:1", "9:16", "16:9", "3:4", "4:3"],
        quality: ["Best"],
        variations: ["1", "2", "3", "4"]
    };

    const fluxOptions = {
        format: ["png", "jpg"],
        size: ["1024x1024", "1024x1792", "1792x1024"],
        quality: ["Best"],
        variations: ["1"]
    };

    const gptDefaultOptions = {
        model: "GPT Image 1",
        format: gptOptions.format[0],
        size: gptOptions.size[1],
        quality: gptOptions.quality[2],
        fidelity: gptOptions.fidelity[0],
        background: gptOptions.background[0],
        variations: gptOptions.variations[0]
    };

    const geminiDefaultOptions = {
        model: "Gemini",
        engine: geminiOptions.engine[0],
        format: geminiOptions.format[0],
        size: geminiOptions.size[1],
        quality: geminiOptions.quality[0],
        fidelity: "",
        background: "",
        variations: geminiOptions.variations[0]
    };

    const fluxDefaultOptions = {
        model: "FLUX.1 Kontext Pro",
        format: fluxOptions.format[0],
        size: fluxOptions.size[1],
        quality: fluxOptions.quality[0],
        fidelity: "",
        background: "",
        variations: fluxOptions.variations[0]
    };

    // Use the default options for initial state
    const [localSettings, setLocalSettings] = useState(gptDefaultOptions);

    useEffect(() => {
        // Merge store settings with appropriate defaults based on model
        const isGemini = storeSettings.model === "Gemini";
        const isFlux = storeSettings.model === "FLUX.1 Kontext Pro";
        const defaultOptions = isGemini ? geminiDefaultOptions :
            isFlux ? fluxDefaultOptions :
                gptDefaultOptions;

        // Ensure the local state keeps "variations" as a string and fills in missing values
        setLocalSettings({
            ...defaultOptions,
            ...storeSettings,
            variations: storeSettings.variations.toString()
        });
    }, [storeSettings]);

    // Define which settings are configurable for each model
    const configurableSettings = {
        "GPT Image 1": ["model", "format", "size", "quality", "variations", "fidelity", "background"],
        "Gemini": ["model", "engine", "format", "size", "quality", "variations"],
        "FLUX.1 Kontext Pro": ["model", "format", "size", "quality", "variations"]
    };

    // Get the list of settings to display based on selected model
    const getVisibleSettings = () => {
        return configurableSettings[localSettings.model as keyof typeof configurableSettings] || [];
    };

    // Dynamically choose options based on selected model
    const getOptionsForModel = () => {
        const isGemini = localSettings.model === "Gemini";
        const isFlux = localSettings.model === "FLUX.1 Kontext Pro";
        return {
            model: ["GPT Image 1", "Gemini", "FLUX.1 Kontext Pro"],
            ...(isGemini ? geminiOptions : isFlux ? fluxOptions : gptOptions)
        };
    };

    const options = getOptionsForModel();
    const visibleSettings = getVisibleSettings();

    // Function to get icon based on setting key
    const getIconForSetting = (key: string) => {
        const iconMap: { [key: string]: React.ReactElement } = {
            model: <IconCpu size={16} />,
            engine: <IconPhotoAi size={16} />,
            format: <IconFile size={16} />,
            size: <IconRuler size={16} />,
            quality: <IconSparkles size={16} />,
            fidelity: <IconUserScan size={16} />,
            background: <IconBackground size={16} />,
            variations: <IconCopy size={16} />
        };
        return iconMap[key] || <IconPhotoX size={16} />;
    };

    const handleChange = (key: keyof typeof localSettings, value: string) => {
        let updatedSettings = {
            ...localSettings,
            [key]: value
        };

        // If model changed, reset to that model's defaults
        if (key === 'model') {
            const newDefaults = value === "Gemini"
                ? { ...geminiDefaultOptions }
                : value === "FLUX.1 Kontext Pro"
                    ? { ...fluxDefaultOptions }
                    : { ...gptDefaultOptions };

            updatedSettings = {
                ...newDefaults,
                model: value // Ensure the model is set to the selected value
            };
        }

        if (key === 'fidelity') {
            toast.info("Control how much effort the model will exert to match the style and features, especially facial features, of input images.", { autoClose: 7000 });
        }

        setLocalSettings(updatedSettings);

        // Update global store (convert variations to number for Settings type)
        setSettings({ ...updatedSettings, variations: parseInt(updatedSettings.variations, 10) });
    };

    // Function to clear the compare array
    const handleClearCompare = () => {
        clearCompare();
        toast.info("Comparison images cleared");
    };

    // Check if we have exactly 2 images to compare
    const canCompare = compareImages.length === 2;

    // Check if we have any images to clear
    const hasCompareImages = compareImages.length > 0;

    return (
        <>
            <Box className="fixed bottom-[50px] left-1/2 transform -translate-x-1/2 z-10">
                <Card className="x-toolbar backdrop-blur-sm">
                    <Flex gap="2" align="center" mx="4">
                        <Text size="2" color="gray">
                            Current settings:
                        </Text>
                        {Object.entries(options)
                            .filter(([key]) => visibleSettings.includes(key))
                            .map(([key, values]) => (
                                <Flex key={key} gap="1">
                                    <Select.Root
                                        value={localSettings[key as keyof typeof localSettings]}
                                        onValueChange={(value) => handleChange(key as keyof typeof localSettings, value)}
                                    >
                                        <Select.Trigger variant="soft">
                                            <Flex gap="2" align="center">
                                                {getIconForSetting(key)}
                                                {localSettings[key as keyof typeof localSettings]}
                                            </Flex>
                                        </Select.Trigger>
                                        <Select.Content>
                                            <Select.Group>
                                                <Select.Label>{key.charAt(0).toUpperCase() + key.slice(1)}</Select.Label>
                                                {values.map(value => (
                                                    <Select.Item key={value} value={value}>
                                                        {value}
                                                    </Select.Item>
                                                ))}
                                            </Select.Group>
                                        </Select.Content>
                                    </Select.Root>
                                </Flex>
                            ))}
                        {canCompare && (
                            <Button variant="solid" onClick={() => setCompareOpen(true)} highContrast>
                                <IconArrowBarBoth size={20} />
                                Compare (2)
                            </Button>
                        )}
                        {hasCompareImages && (
                            <Tooltip content="Clear comparison images">
                                <IconButton variant="ghost" radius="full" onClick={handleClearCompare} ml="2" highContrast>
                                    <IconPhotoX size={20} />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Flex>
                </Card>
            </Box>

            <Compare open={compareOpen} onOpenChange={setCompareOpen} />
        </>
    );
}