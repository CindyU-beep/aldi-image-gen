import { useEffect, useState } from 'react';
import { Dialog, Button, Flex, Box, IconButton, Text, Card, Tabs, Select, TextField, Grid, Inset, Spinner } from '@radix-ui/themes';
import { IconX, IconExternalLink, IconPhotoDown } from '@tabler/icons-react';
import { useImageLibrary } from '@/hooks/useImageLibrary';
import useShopbop from '@/hooks/useShopbop';
import useAmazon from '@/hooks/useAmazon';
import usePexels from '@/hooks/usePexels';
import useStore from '@/lib/store';
import { checkImageUrl } from '@/lib/helpers';
import { toast } from 'react-toastify';
import { ImageLibraryImage } from './ImageLibraryImage';

// Define the category options
const categories = [
    { value: 'sbm', label: 'Men' },
    { value: 'sbw', label: 'Women' },
];

export const ImageLibraryDialog = () => {
    const isDialogOpen = useStore(state => state.isImageLibraryDialogOpen);
    const closeImageLibraryDialog = useStore(state => state.closeImageLibraryDialog);
    const options = useStore(state => state.imageLibraryOptions);

    const isSelectionMode = options?.selectionMode || false;
    const onSelectCallback = options?.onSelect;

    const {
        libraryImages,
        isLoading,
        isUploading,
        selectedFile,
        fileInputRef,
        handleFileSelect,
        uploadSelectedFile,
        fetchLibraryImages,
        handleDeleteImage,
        uploadImageFromUrl
    } = useImageLibrary();

    const {
        searchTerm: shopbopSearchTerm,
        setSearchTerm: setShopbopSearchTerm,
        categoryId,
        setCategoryId,
        products,
        loading: shopbopLoading,
        handleSearch: handleShopbopSearch,
        openProductInNewTab
    } = useShopbop();

    const {
        searchTerm: amazonSearchTerm,
        setSearchTerm: setAmazonSearchTerm,
        products: amazonProducts,
        loading: amazonLoading,
        handleSearch: handleAmazonSearch,
        openProductInNewTab: openAmazonProductInNewTab
    } = useAmazon();

    const {
        searchTerm: pexelsSearchTerm,
        setSearchTerm: setPexelsSearchTerm,
        photos,
        loading: pexelsLoading,
        handleSearch: handlePexelsSearch,
        openPhotoInNewTab
    } = usePexels();

    // Fetch images when dialog opens
    useEffect(() => {
        if (isDialogOpen) {
            fetchLibraryImages();
            toast.info('This library is shared with other users. Please don\'t delete someone else\'s images. Thank you.');
        }
    }, [isDialogOpen, fetchLibraryImages]);

    const [uploadingImageId, setUploadingImageId] = useState<string | null>(null);

    // Add this function to upload a product image to the library
    const uploadToLibrary = async (product: any) => {
        if (!product.mainImage?.url) {
            toast.error('No image available to upload');
            return;
        }

        const imageUrl = product.mainImage.url;
        const imageName = product.name || 'Shopbop Product';

        setUploadingImageId(imageUrl);

        try {
            await uploadImageFromUrl(imageUrl, imageName);
            fetchLibraryImages();
        } catch (error) {
            console.error('Error uploading image to library:', error);
            toast.error('Failed to add image to library');
        } finally {
            setUploadingImageId(null);
        }
    };

    // Add this function to upload a pexels photo to the library
    const uploadPexelsToLibrary = async (photo: any) => {
        if (!photo.src?.large) {
            toast.error('No image available to upload');
            return;
        }

        const imageUrl = photo.src.large;
        const imageName = `Photo by ${photo.photographer}` || 'Pexels Photo';

        setUploadingImageId(imageUrl);

        try {
            await uploadImageFromUrl(imageUrl, imageName);
            fetchLibraryImages();
        } catch (error) {
            console.error('Error uploading image to library:', error);
            toast.error('Failed to add image to library');
        } finally {
            setUploadingImageId(null);
        }
    };

    return (
        <Dialog.Root open={isDialogOpen} onOpenChange={(open) => !open && closeImageLibraryDialog()}>
            <Dialog.Content maxWidth="calc(1440px - 48px)">
                <Dialog.Title>Library</Dialog.Title>
                <IconButton
                    aria-label="Close"
                    variant="ghost"
                    color="gray"
                    radius="full"
                    onClick={closeImageLibraryDialog}
                    style={{ position: 'absolute', top: 20, right: 20 }}
                    highContrast
                >
                    <IconX size={18} />
                </IconButton>

                <Tabs.Root defaultValue="library">
                    <Tabs.List>
                        <Tabs.Trigger value="library">Library (Shared)</Tabs.Trigger>
                        <Tabs.Trigger value="shopbop">Shopbop</Tabs.Trigger>
                        <Tabs.Trigger value="amazon">Amazon</Tabs.Trigger>
                        <Tabs.Trigger value="pexels">Pexels</Tabs.Trigger>
                    </Tabs.List>

                    <Tabs.Content value="library">
                        {/* Library images section */}
                        <Flex direction="row" align="start" py="4">
                            {isLoading ? (
                                <Flex justify="center" align="center" className="flex-1" height="60vh">
                                    <Spinner size="3" mr="2" />
                                    <Text color="gray">Loading...</Text>
                                </Flex>
                            ) : libraryImages.length === 0 ? (
                                <Flex justify="center" align="center" className="flex-1" height="60vh">
                                    <Text color="gray">No images found in library.</Text>
                                </Flex>
                            ) : (
                                <Box className="overflow-auto h-[60vh]">
                                    <div className="masonry-grid columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
                                        {libraryImages.map((image) => (
                                            <ImageLibraryImage
                                                key={image.url}
                                                image={image}
                                                isSelectionMode={isSelectionMode}
                                                onSelectCallback={onSelectCallback}
                                                onDelete={handleDeleteImage}
                                            />
                                        ))}
                                    </div>
                                </Box>
                            )}
                        </Flex>
                        {/* Simple File upload section */}
                        <Card>
                            <Flex gap="2" align="center">
                                <Flex width="100%" position="relative" align="center" justify="between">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileSelect}
                                        accept="image/jpeg,image/png,image/gif,image/webp"
                                        className="absolute inset-0 h-[32px] w-[100px] cursor-pointer opacity-0"
                                        aria-label="Select file"
                                    />
                                    <Button
                                        type="button"
                                        variant="soft"
                                    >
                                        Select file
                                    </Button>
                                    {selectedFile && (
                                        <Text>
                                            Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                                        </Text>
                                    )}
                                </Flex>
                                <Button
                                    onClick={uploadSelectedFile}
                                    disabled={!selectedFile || isUploading}
                                    type="button"
                                    highContrast
                                >
                                    {isUploading ? 'Uploading...' : 'Upload'}
                                </Button>
                            </Flex>
                        </Card>
                    </Tabs.Content>

                    <Tabs.Content value="shopbop">
                        <Flex direction="column" py="4">
                            {/* Search section */}
                            <Card>
                                <Flex gap="3" align="center">
                                    <Select.Root value={categoryId} onValueChange={setCategoryId}>
                                        <Select.Trigger placeholder="Select category" />
                                        <Select.Content>
                                            {categories.map((category) => (
                                                <Select.Item key={category.value} value={category.value}>
                                                    {category.label}
                                                </Select.Item>
                                            ))}
                                        </Select.Content>
                                    </Select.Root>

                                    <TextField.Root style={{ flexGrow: 1 }}
                                        placeholder="Search Shopbop for fashion..."
                                        value={shopbopSearchTerm}
                                        onChange={(e) => setShopbopSearchTerm(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleShopbopSearch();
                                        }}
                                    />

                                    <Button onClick={handleShopbopSearch} disabled={shopbopLoading} highContrast>
                                        Search
                                    </Button>
                                </Flex>
                            </Card>
                            {/* Results section */}
                            <Flex direction="column" py="4" minHeight="60vh">
                                {shopbopLoading ? (
                                    <Flex justify="center" align="center" className="flex-1">
                                        <Spinner size="3" mr="2" />
                                        <Text color="gray">Searching...</Text>
                                    </Flex>
                                ) : products.length === 0 ? (
                                    <Flex direction="column" justify="center" align="center" className="flex-1">
                                        <img src="assets/shopbop.png" alt="Shopbop" className="w-[300px]" />
                                        <Text color="gray">Try searching for something.</Text>
                                    </Flex>
                                ) : (
                                    <Box className="overflow-auto h-[60vh]">
                                        <Grid gap="3" columns={{ initial: "1", sm: "3", md: "5" }} width="auto">
                                            {products.map((product, index) => (
                                                <Card key={index}>
                                                    <Flex direction="column">
                                                        <Inset clip="padding-box" side="top" pb="current">
                                                            <img
                                                                src={checkImageUrl(product.mainImage?.url)}
                                                                alt={product.name}
                                                                style={{ cursor: 'pointer' }}
                                                                onClick={isSelectionMode && onSelectCallback && product.mainImage?.url
                                                                    ? () => onSelectCallback(product.mainImage.url, product.url)
                                                                    : () => openProductInNewTab(product.url)
                                                                }
                                                            />
                                                        </Inset>
                                                        <Flex justify="between" align="start" gap="2">
                                                            <Text size="2">
                                                                {product.name}
                                                            </Text>
                                                            <Flex gap="2">
                                                                <IconButton
                                                                    variant="ghost"
                                                                    radius="full"
                                                                    disabled={uploadingImageId === product.mainImage?.url}
                                                                    onClick={() => uploadToLibrary(product)}
                                                                    aria-label="Save to library"
                                                                >
                                                                    {uploadingImageId === product.mainImage?.url ? (
                                                                        <Spinner size="1" />
                                                                    ) : (
                                                                        <IconPhotoDown size={20} className="cursor-pointer" />
                                                                    )}
                                                                </IconButton>
                                                                <IconButton
                                                                    variant="ghost"
                                                                    radius="full"
                                                                    onClick={() => openProductInNewTab(product.url)}
                                                                    aria-label="Open in new tab"
                                                                >
                                                                    <IconExternalLink size={20} className="cursor-pointer" />
                                                                </IconButton>
                                                            </Flex>
                                                        </Flex>
                                                    </Flex>
                                                </Card>
                                            ))}
                                        </Grid>
                                    </Box>
                                )}
                            </Flex>
                        </Flex>
                    </Tabs.Content>

                    <Tabs.Content value="amazon">
                        <Flex direction="column" py="4">
                            {/* Search section */}
                            <Card>
                                <Flex gap="3" align="center">
                                    <TextField.Root style={{ flexGrow: 1 }}
                                        placeholder="Search Amazon for electronics, books, tools, home..."
                                        value={amazonSearchTerm}
                                        onChange={(e) => setAmazonSearchTerm(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleAmazonSearch();
                                        }}
                                    />

                                    <Button onClick={handleAmazonSearch} disabled={amazonLoading} highContrast>
                                        Search
                                    </Button>
                                </Flex>
                            </Card>
                            {/* Results section */}
                            <Flex direction="column" py="4" minHeight="60vh">
                                {amazonLoading ? (
                                    <Flex justify="center" align="center" className="flex-1">
                                        <Spinner size="3" mr="2" />
                                        <Text color="gray">Searching...</Text>
                                    </Flex>
                                ) : amazonProducts.length === 0 ? (
                                    <Flex direction="column" justify="center" align="center" className="flex-1">
                                        <img src="assets/amazon.svg" alt="Amazon" className="w-[250px] mt-12" />
                                        <Text color="gray" mt="6">Try searching for something.</Text>
                                    </Flex>
                                ) : (
                                    <Box className="overflow-auto h-[60vh]">
                                        <div className="masonry-grid columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
                                            {amazonProducts.map((product, index) => (
                                                <Card
                                                    key={index}
                                                    className="break-inside-avoid mb-3 inline-block w-full"
                                                >
                                                    <Flex direction="column">
                                                        <Inset clip="padding-box" side="top" pb="current">
                                                            <img
                                                                src={checkImageUrl(product.mainImage?.url)}
                                                                alt={product.name}
                                                                style={{
                                                                    cursor: 'pointer',
                                                                    width: '100%',
                                                                    height: 'auto'
                                                                }}
                                                                onClick={isSelectionMode && onSelectCallback && product.mainImage?.url
                                                                    ? () => onSelectCallback(product.mainImage.url, product.url)
                                                                    : () => openAmazonProductInNewTab(product.url)
                                                                }
                                                            />
                                                        </Inset>
                                                        <Flex justify="between" align="start" gap="2">
                                                            <Text size="2">
                                                                {product.name}
                                                            </Text>
                                                            <Flex gap="2">
                                                                <IconButton
                                                                    variant="ghost"
                                                                    radius="full"
                                                                    disabled={uploadingImageId === product.mainImage?.url}
                                                                    onClick={() => uploadToLibrary(product)}
                                                                    aria-label="Save to library"
                                                                >
                                                                    {uploadingImageId === product.mainImage?.url ? (
                                                                        <Spinner size="1" />
                                                                    ) : (
                                                                        <IconPhotoDown size={20} className="cursor-pointer" />
                                                                    )}
                                                                </IconButton>
                                                                <IconButton
                                                                    variant="ghost"
                                                                    radius="full"
                                                                    onClick={() => openAmazonProductInNewTab(product.url)}
                                                                    aria-label="Open in new tab"
                                                                >
                                                                    <IconExternalLink size={20} className="cursor-pointer" />
                                                                </IconButton>
                                                            </Flex>
                                                        </Flex>
                                                    </Flex>
                                                </Card>
                                            ))}
                                        </div>
                                    </Box>
                                )}
                            </Flex>
                        </Flex>
                    </Tabs.Content>

                    <Tabs.Content value="pexels">
                        <Flex direction="column" py="4">
                            {/* Search section */}
                            <Card>
                                <Flex gap="3" align="center">
                                    <TextField.Root style={{ flexGrow: 1 }}
                                        placeholder="Search for photos..."
                                        value={pexelsSearchTerm}
                                        onChange={(e) => setPexelsSearchTerm(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handlePexelsSearch();
                                        }}
                                    />

                                    <Button onClick={() => handlePexelsSearch()} disabled={pexelsLoading} highContrast>
                                        Search
                                    </Button>
                                </Flex>
                            </Card>
                            {/* Results section */}
                            <Flex direction="column" py="4" minHeight="60vh">
                                {pexelsLoading && photos.length === 0 ? (
                                    <Flex justify="center" align="center" className="flex-1">
                                        <Spinner size="3" mr="2" />
                                        <Text color="gray">Searching...</Text>
                                    </Flex>
                                ) : photos.length === 0 ? (
                                    <Flex direction="column" justify="center" align="center" className="flex-1">
                                        <img src="/assets/pexels.svg" alt="Pexels" className="w-[250px] mt-3" />
                                        <Text color="gray" mt="6">Try searching for something.</Text>
                                    </Flex>
                                ) : (
                                    <Box className="overflow-auto h-[60vh]">
                                        <div className="masonry-grid columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
                                            {photos.map((photo) => (
                                                <Card key={photo.id} className="break-inside-avoid mb-3 inline-block w-full">
                                                    <Flex direction="column">
                                                        <Inset clip="padding-box" side="top" pb="current">
                                                            <img
                                                                src={photo.src.large2x}
                                                                alt={photo.alt}
                                                                style={{ cursor: 'pointer', width: '100%', height: 'auto' }}
                                                                onClick={isSelectionMode && onSelectCallback && photo.src?.large2x
                                                                    ? () => onSelectCallback(photo.src.large2x)
                                                                    : () => openPhotoInNewTab(String(photo.url))}
                                                            />
                                                        </Inset>
                                                        <Flex justify="between" align="start" gap="2">
                                                            <Text size="2">
                                                                <strong>{photo.photographer}</strong> - {photo.alt}
                                                            </Text>
                                                            <Flex gap="2">
                                                                <IconButton
                                                                    variant="ghost"
                                                                    radius="full"
                                                                    disabled={uploadingImageId === photo.src?.large2x}
                                                                    onClick={() => uploadPexelsToLibrary(photo)}
                                                                    aria-label="Save to library"
                                                                >
                                                                    {uploadingImageId === photo.src?.large2x ? (
                                                                        <Spinner size="1" />
                                                                    ) : (
                                                                        <IconPhotoDown size={20} className="cursor-pointer" />
                                                                    )}
                                                                </IconButton>
                                                                <IconButton
                                                                    variant="ghost"
                                                                    radius="full"
                                                                    onClick={() => openPhotoInNewTab(String(photo.url))}
                                                                    aria-label="Open in new tab"
                                                                >
                                                                    <IconExternalLink size={20} className="cursor-pointer" />
                                                                </IconButton>
                                                            </Flex>
                                                        </Flex>
                                                    </Flex>
                                                </Card>
                                            ))}
                                        </div>
                                    </Box>
                                )}
                            </Flex>
                        </Flex>
                    </Tabs.Content>
                </Tabs.Root>
            </Dialog.Content>
        </Dialog.Root>
    );
};