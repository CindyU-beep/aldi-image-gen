import { useState, useRef, useEffect } from 'react';
import { Heading, TextField, IconButton, Flex } from '@radix-ui/themes';
import { IconEdit, IconCheck, IconX } from '@tabler/icons-react';

interface EditableTimelineNameProps {
    name: string;
    onNameChange: (newName: string) => void;
    size?: "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
}

export default function EditableTimelineName({ 
    name, 
    onNameChange, 
    size = "4" 
}: EditableTimelineNameProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(name);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleStartEdit = () => {
        setEditValue(name);
        setIsEditing(true);
    };

    const handleSave = () => {
        const trimmedValue = editValue.trim();
        if (trimmedValue && trimmedValue !== name) {
            onNameChange(trimmedValue);
        }
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditValue(name);
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSave();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            handleCancel();
        }
    };

    if (isEditing) {
        return (
            <Flex align="center" gap="2">
                <TextField.Root
                    ref={inputRef}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleSave}
                    size="2"
                    style={{ minWidth: '200px' }}
                />
                <IconButton
                    variant="ghost"
                    size="1"
                    onClick={handleSave}
                    color="green"
                >
                    <IconCheck size={14} />
                </IconButton>
                <IconButton
                    variant="ghost"
                    size="1"
                    onClick={handleCancel}
                    color="red"
                >
                    <IconX size={14} />
                </IconButton>
            </Flex>
        );
    }

    return (
        <Flex align="center" gap="2" className="group">
            <Heading size={size} as="h2" my="1">
                {name}
            </Heading>
            <IconButton
                variant="ghost"
                size="1"
                onClick={handleStartEdit}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <IconEdit size={14} />
            </IconButton>
        </Flex>
    );
}