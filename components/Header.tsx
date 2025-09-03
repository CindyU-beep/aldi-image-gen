import Image from 'next/image';
import { Flex, Heading } from '@radix-ui/themes';

interface HeaderProps {
    hideHeading?: boolean;
}

const Header = ({ hideHeading }: HeaderProps) => {

    return (
        <Flex
            align="center"
            justify="between"
            className="fixed w-full py-4 px-6 z-2"
        >
            <Flex align="center">
                <Image
                    src="./assets/gbb-logo.svg"
                    alt="GBB Logo"
                    width="20"
                    height="20"
                    className="cursor-pointer"
                />
                {!hideHeading && (
                    <Heading size="3" as="h1" className="!ml-2">
                        ImageDojo
                    </Heading>
                )}
            </Flex>
            <Flex>
                {/* Navigation or additional actions can be added here */}
            </Flex>
        </Flex>
    );
};

export default Header;