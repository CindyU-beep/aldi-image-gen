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
                    src="/aldi-nord.png"
                    alt="ALDI Nord"
                    width="36"
                    height="36"
                    className="cursor-pointer"
                />
                {!hideHeading && (
                    <Heading size="4" as="h1" className="!ml-3">
                        Marketing Studio
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