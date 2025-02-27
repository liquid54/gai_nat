import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, StyleSheet } from 'react-native';

type Option = {
    label?: string;
    value?: string;
    name?: string;
    avatar_id?: string;
    key?: string;
};

type CustomSelectProps = {
    label: string;
    value: string;
    onValueChange: (value: string) => void;
    placeholder: string;
    options: Option[];
};

const CustomSelect: React.FC<CustomSelectProps> = ({
                                                       label,
                                                       value,
                                                       onValueChange,
                                                       placeholder,
                                                       options
                                                   }) => {
    const [isOpen, setIsOpen] = useState(false);

    const selectedOption = options.find(option =>
        (option.value || option.avatar_id) === value
    );

    const displayValue = selectedOption
        ? (selectedOption.label || selectedOption.name)
        : placeholder;

    return (
        <View style={styles.container}>
            <Text style={styles.label}>{label}</Text>

            <TouchableOpacity
                onPress={() => setIsOpen(true)}
                style={styles.selectButton}
                activeOpacity={0.7}
            >
                <Text style={value ? styles.selectedText : styles.placeholderText}>
                    {displayValue}
                </Text>
                <Text style={styles.arrowIcon}>▼</Text>
            </TouchableOpacity>

            <Modal
                visible={isOpen}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setIsOpen(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setIsOpen(false)}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{label}</Text>
                        </View>

                        <ScrollView style={styles.optionsList}>
                            {options.map((option) => (
                                <TouchableOpacity
                                    key={option.value || option.avatar_id || option.key}
                                    style={styles.optionItem}
                                    onPress={() => {
                                        onValueChange(option.value || option.avatar_id || '');
                                        setIsOpen(false);
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.optionText,
                                            (option.value || option.avatar_id) === value ? styles.selectedOptionText : {}
                                        ]}
                                    >
                                        {option.label || option.name}
                                    </Text>
                                    {(option.value || option.avatar_id) === value && (
                                        <Text style={styles.checkmark}>✓</Text>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setIsOpen(false)}
                        >
                            <Text style={styles.closeButtonText}>Закрити</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
        color: '#333',
    },
    selectButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    selectedText: {
        color: '#333',
        fontSize: 16,
    },
    placeholderText: {
        color: '#999',
        fontSize: 16,
    },
    arrowIcon: {
        fontSize: 12,
        color: '#666',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '80%',
        maxHeight: '80%',
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    modalHeader: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        backgroundColor: '#fafafa',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
    },
    optionsList: {
        maxHeight: 300,
    },
    optionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    optionText: {
        fontSize: 16,
        color: '#333',
    },
    selectedOptionText: {
        color: '#2563eb',
        fontWeight: '500',
    },
    checkmark: {
        color: '#2563eb',
        fontSize: 18,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: 16,
        alignItems: 'center',
        backgroundColor: '#fafafa',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    closeButtonText: {
        color: '#2563eb',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default CustomSelect;