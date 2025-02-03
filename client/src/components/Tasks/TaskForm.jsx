import React, { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { formatUTCDate } from '../../utils/dateUtils';

export const TaskForm = ({
    isOpen,
    onClose,
    selectedDates,
    selectedTask,
    resources = [],
    statuses = [],
    backlogs = [],
    onSubmit
}) => {
    const defaultStartDate = new Date().toISOString().split('T')[0];

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        startDate: formatUTCDate(selectedDates?.start) || defaultStartDate,
        endDate: formatUTCDate(selectedDates?.end) || defaultStartDate,
        resourceId: selectedDates?.resourceId || '',
        statusId: selectedDates?.resourceId ? '2' : ''
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validateForm = useCallback(() => {
        const newErrors = {};
        
        if (!formData.title.trim()) {
            newErrors.title = 'Le titre est requis';
        }
        
        if (!formData.startDate) {
            newErrors.startDate = 'La date de début est requise';
        }
        
        if (!formData.endDate) {
            newErrors.endDate = 'La date de fin est requise';
        }
        
        if (formData.startDate && formData.endDate && 
            new Date(formData.startDate) > new Date(formData.endDate)) {
            newErrors.endDate = 'La date de fin doit être postérieure à la date de début';
        }

        if (!formData.statusId) {
            newErrors.statusId = 'Le statut est requis';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData]);

    useEffect(() => {
        if (selectedTask) {
            setFormData({
                title: selectedTask.title || '',
                description: selectedTask.description || '',
                startDate: formatUTCDate(selectedTask.start) || defaultStartDate,
                endDate: formatUTCDate(selectedTask.end) || defaultStartDate,
                resourceId: selectedTask.resourceId || '',
                statusId: selectedTask.resourceId ? '2' : (selectedTask.statusId || '')
            });
        } else if (selectedDates) {
            setFormData(prev => ({
                ...prev,
                startDate: formatUTCDate(selectedDates.start) || defaultStartDate,
                endDate: formatUTCDate(selectedDates.end) || defaultStartDate,
                resourceId: selectedDates.resourceId || '',
                statusId: selectedDates.resourceId ? '2' : prev.statusId
            }));
        }
    }, [selectedTask, selectedDates, defaultStartDate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit(formData, selectedTask?.id);
            onClose();
        } catch (error) {
            console.error('Error submitting form:', error);
            setErrors(prev => ({
                ...prev,
                submit: 'Une erreur est survenue lors de la soumission du formulaire'
            }));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = {
                ...prev,
                [name]: value
            };
            if (name === 'resourceId' && value !== '') {
                newData.statusId = '2';
            }
            return newData;
        });
        
        // Clear error when field is modified
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };

    // Stop propagation of clicks inside the modal
    const handleModalClick = (e) => {
        e.stopPropagation();
    };

    if (!isOpen) return null;

    const FormField = ({ label, name, error, children }) => (
        <div>
            <label htmlFor={name} className="block mb-1 font-medium text-gray-700">
                {label}
                {error && <span className="text-red-500 text-sm ml-2">{error}</span>}
            </label>
            {children}
        </div>
    );

    const getInputClassName = (error) => `
        w-full 
        border 
        rounded 
        p-2 
        transition-colors
        focus:outline-none 
        focus:ring-2 
        focus:ring-blue-500
        ${error ? 'border-red-500' : 'border-gray-300'}
    `;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={onClose}
            onKeyDown={handleKeyDown}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div 
                className="bg-white p-6 rounded-lg w-96 relative max-h-[90vh] overflow-y-auto"
                onClick={handleModalClick}
            >
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Fermer"
                >
                    <X size={20} />
                </button>

                <h2 id="modal-title" className="text-xl font-bold mb-4">
                    {selectedTask ? 'Modifier la tâche' : 'Nouvelle tâche'}
                </h2>

                {errors.submit && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                        {errors.submit}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <FormField label="Titre" name="title" error={errors.title}>
                        <input
                            id="title"
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className={getInputClassName(errors.title)}
                            required
                            autoFocus
                        />
                    </FormField>

                    <FormField label="Description" name="description">
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className={getInputClassName()}
                            rows="4"
                            placeholder="Description optionnelle de la tâche"
                        />
                    </FormField>

                    <FormField label="Assigné à" name="resourceId">
                        <select
                            id="resourceId"
                            name="resourceId"
                            value={formData.resourceId}
                            onChange={handleChange}
                            className={getInputClassName()}
                        >
                            <option value="">Sélectionner une personne</option>
                            {resources.map(resource => (
                                <option key={resource.id} value={resource.id}>
                                    {resource.title}
                                </option>
                            ))}
                        </select>
                    </FormField>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Date de début" name="startDate" error={errors.startDate}>
                            <input
                                id="startDate"
                                type="date"
                                name="startDate"
                                value={formData.startDate}
                                onChange={handleChange}
                                className={getInputClassName(errors.startDate)}
                                required
                            />
                        </FormField>

                        <FormField label="Date de fin" name="endDate" error={errors.endDate}>
                            <input
                                id="endDate"
                                type="date"
                                name="endDate"
                                value={formData.endDate}
                                onChange={handleChange}
                                className={getInputClassName(errors.endDate)}
                                required
                            />
                        </FormField>
                    </div>

                    <FormField label="Statut" name="statusId" error={errors.statusId}>
                        <select
                            id="statusId"
                            name="statusId"
                            value={formData.statusId}
                            onChange={handleChange}
                            className={getInputClassName(errors.statusId)}
                            required
                            disabled={formData.resourceId !== ''}
                        >
                            <option value="">Sélectionner un statut</option>
                            {statuses.map(status => (
                                <option key={status.statusId} value={status.statusId}>
                                    {status.statusType}
                                </option>
                            ))}
                        </select>
                    </FormField>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="
                                flex-1
                                bg-blue-500 
                                text-white 
                                px-4 
                                py-2 
                                rounded 
                                hover:bg-blue-600
                                disabled:bg-blue-300
                                disabled:cursor-not-allowed
                                transition-colors
                            "
                        >
                            {isSubmitting ? 'En cours...' : (selectedTask ? 'Modifier' : 'Créer')}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="
                                flex-1
                                bg-gray-300 
                                px-4 
                                py-2 
                                rounded 
                                hover:bg-gray-400
                                disabled:bg-gray-200
                                disabled:cursor-not-allowed
                                transition-colors
                            "
                        >
                            Annuler
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};