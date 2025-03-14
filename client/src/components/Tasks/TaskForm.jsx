import React, { useState, useCallback, useEffect } from 'react';
import { X } from 'lucide-react';
import { ERROR_MESSAGES } from '../../constants/constants';
import { DateUtils } from '../../utils/dateUtils';

export const TaskForm = ({
    isOpen,
    onClose,
    selectedDates,
    selectedTask,
    resources = [],
    statuses = [],
    onSubmit: handleTaskSubmit
}) => {

    // Fonction d'aide pour formater les dates ISO en YYYY-MM-DD
    const formatDateForInput = useCallback((dateString) => {
        if (!dateString) return '';

        // Si la date est déjà au format YYYY-MM-DD, la retourner telle quelle
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            return dateString;
        }

        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return ''; // Date invalide

            // Utiliser les méthodes UTC pour extraire année, mois et jour
            const year = date.getUTCFullYear();
            const month = String(date.getUTCMonth() + 1).padStart(2, '0');
            const day = String(date.getUTCDate()).padStart(2, '0');

            return `${year}-${month}-${day}`;
        } catch (e) {
            console.error('Erreur lors du formatage de la date:', e);
            return '';
        }
    }, []);

    // Obtenir la date du jour formatée
    const getTodayFormatted = useCallback(() => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }, []);

    const getInitialFormData = useCallback(() => {
        console.log('selectedTask :', selectedTask);
        console.log('selectedDates :', selectedDates);

        // Si une tâche est sélectionnée (quelle que soit sa source)
        if (selectedTask) {
            // Si la tâche a des propriétés start et end, elle vient probablement du calendrier
            const isFromCalendar = selectedTask.start && selectedTask.end;

            const endForForm = DateUtils.adjustEndDateForForm(selectedTask.end);

            return {
                title: selectedTask.title || '',
                description: selectedTask.description || selectedTask.extendedProps?.description || '',
                startDate: isFromCalendar
                    ? formatDateForInput(selectedTask.start)
                    : (selectedDates ? formatDateForInput(selectedDates.start) : getTodayFormatted()),
                endDate: isFromCalendar
                    ? formatDateForInput(endForForm)
                    : (selectedDates ? formatDateForInput(endForForm) : getTodayFormatted()),
                resourceId: selectedTask.resourceId || (selectedDates ? selectedDates.resourceId : '') || '',
                statusId: selectedTask.statusId || selectedTask.extendedProps?.statusId || '2',
                isConge: selectedTask.isConge || selectedTask.title === 'CONGE' || false
            };
        }

        // Si on crée une nouvelle tâche depuis le calendrier
        if (selectedDates && !selectedTask) {
            const endForForm = DateUtils.adjustEndDateForForm(selectedDates.end);
            return {
                title: '',
                description: '',
                startDate: formatDateForInput(selectedDates.start),
                endDate: formatDateForInput(endForForm),
                resourceId: selectedDates.resourceId || '',
                statusId: selectedDates.resourceId ? '2' : '',
                isConge: false
            };
        }

        // Cas par défaut (nouvelle tâche sans contexte)
        const today = getTodayFormatted();
        return {
            title: '',
            description: '',
            startDate: today,
            endDate: DateUtils.adjustEndDateForForm(today),
            resourceId: '',
            statusId: '',
            isConge: false
        };
    }, [selectedDates, selectedTask, formatDateForInput, getTodayFormatted]);

    const [formData, setFormData] = useState(getInitialFormData());
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setFormData(getInitialFormData());
            setErrors({});
        }
    }, [getInitialFormData, isOpen, selectedDates, selectedTask]);

    const handleChange = useCallback((e) => {
        if (!e || !e.target) return;

        const { name, value, type, checked } = e.target;
        setFormData(prev => {
            const newData = {
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            };

            if (name === 'isConge') {
                if (checked) {
                    newData.statusId = '2';
                    newData.title = 'CONGE';
                } else {
                    newData.title = '';
                    if (!newData.resourceId) {
                        newData.statusId = '';
                    }
                }
            }

            if (name === 'resourceId' && value !== '') {
                newData.statusId = '2';
            }

            return newData;
        });

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    }, [errors]);

    const validateForm = useCallback(() => {
        const newErrors = {};

        if (!formData.title.trim()) {
            newErrors.title = ERROR_MESSAGES.TITLE_REQUIRED;
        }

        if (!formData.startDate) {
            newErrors.startDate = ERROR_MESSAGES.START_DATE_REQUIRED;
        }

        if (!formData.endDate) {
            newErrors.endDate = ERROR_MESSAGES.END_DATE_REQUIRED;
        }

        if (formData.startDate && formData.endDate &&
            new Date(formData.startDate) > new Date(formData.endDate)) {
            newErrors.endDate = ERROR_MESSAGES.END_DATE_VALIDATION;
        }

        if (formData.isConge) {
            if (!formData.resourceId) {
                newErrors.resourceId = 'La ressource est requise pour un congé';
            }
        } else if (!formData.statusId) {
            newErrors.statusId = ERROR_MESSAGES.STATUS_REQUIRED;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        try {
            // Convertir les dates du format YYYY-MM-DD en dates ISO
            // en s'assurant qu'elles sont interprétées en UTC et non en local
            let startISO, endISO;

            if (formData.startDate) {
                // Crée une date UTC à partir de la chaîne YYYY-MM-DD
                const [startYear, startMonth, startDay] = formData.startDate.split('-').map(Number);
                const startDate = new Date(Date.UTC(startYear, startMonth - 1, startDay));
                startISO = startDate.toISOString();
            }

            if (formData.endDate) {
                // Pour la date de fin, nous ajoutons un jour car FullCalendar l'interprète comme exclusive
                const [endYear, endMonth, endDay] = formData.endDate.split('-').map(Number);
                const endDate = new Date(Date.UTC(endYear, endMonth - 1, endDay + 1));
                endISO = endDate.toISOString();
            }

            await handleTaskSubmit({
                ...formData,
                id: selectedTask?.id,
                start: startISO,
                end: endISO
            });
            onClose();
        } catch (error) {
            console.error('Error submitting form:', error);
            setErrors(prev => ({
                ...prev,
                submit: ERROR_MESSAGES.SUBMIT_ERROR
            }));
        } finally {
            setIsSubmitting(false);
        }
    }, [formData, handleTaskSubmit, onClose, selectedTask?.id, validateForm]);

    const handleBackdropClick = useCallback((e) => {
        if (e.target === e.currentTarget) {
            e.preventDefault();
            e.stopPropagation();
            onClose();
        }
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={handleBackdropClick}
        >
            <div className="bg-white p-6 rounded-lg w-96 relative max-h-[90vh] overflow-y-auto">
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
                >
                    <X size={20} />
                </button>

                <h2 className="text-xl font-bold mb-6">
                    {selectedTask ? 'Modifier la tâche' : 'Nouvelle tâche'}
                </h2>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="isConge"
                                name="isConge"
                                checked={formData.isConge}
                                onChange={handleChange}
                                className="h-4 w-4 text-blue-600"
                            />
                            <label htmlFor="isConge" className="text-gray-700">
                                Congé
                            </label>
                        </div>

                        <div>
                            <label htmlFor="title" className="block mb-1">Titre</label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className="w-full p-2 border rounded"
                                disabled={formData.isConge}
                                required
                            />
                            {errors.title && (
                                <span className="text-red-500 text-sm">{errors.title}</span>
                            )}
                        </div>

                        <div>
                            <label htmlFor="description" className="block mb-1">Description</label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                className="w-full p-2 border rounded"
                                rows="4"
                            />
                        </div>

                        <div>
                            <label htmlFor="resourceId" className="block mb-1">Assigné à</label>
                            <select
                                id="resourceId"
                                name="resourceId"
                                value={formData.resourceId}
                                onChange={handleChange}
                                className="w-full p-2 border rounded"
                                required={formData.isConge}
                            >
                                <option value="">Sélectionner une personne</option>
                                {resources
                                    .filter(resource => !resource.isTeam && !resource.id.toString().startsWith('team_'))
                                    .map(resource => (
                                        <option key={resource.id} value={resource.id}>
                                            {resource.title}
                                        </option>
                                    ))}
                            </select>
                            {errors.resourceId && (
                                <span className="text-red-500 text-sm">{errors.resourceId}</span>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="startDate" className="block mb-1">Date de début</label>
                                <input
                                    type="date"
                                    id="startDate"
                                    name="startDate"
                                    value={formData.startDate}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded"
                                    required
                                />
                                {errors.startDate && (
                                    <span className="text-red-500 text-sm">{errors.startDate}</span>
                                )}
                            </div>

                            <div>
                                <label htmlFor="endDate" className="block mb-1">Date de fin</label>
                                <input
                                    type="date"
                                    id="endDate"
                                    name="endDate"
                                    value={formData.endDate}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded"
                                    required
                                />
                                {errors.endDate && (
                                    <span className="text-red-500 text-sm">{errors.endDate}</span>
                                )}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="statusId" className="block mb-1">Statut</label>
                            <select
                                id="statusId"
                                name="statusId"
                                value={formData.statusId}
                                onChange={handleChange}
                                className="w-full p-2 border rounded"
                                required={!formData.isConge}
                                disabled={formData.resourceId !== '' || formData.isConge}
                            >
                                <option value="">Sélectionner un statut</option>
                                {statuses.map(status => (
                                    <option key={status.statusId} value={status.statusId}>
                                        {status.statusType}
                                    </option>
                                ))}
                            </select>
                            {errors.statusId && (
                                <span className="text-red-500 text-sm">{errors.statusId}</span>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-4 mt-6">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
                        >
                            {isSubmitting ? 'En cours...' : (selectedTask ? 'Modifier' : 'Créer')}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="flex-1 bg-gray-300 p-2 rounded hover:bg-gray-400 disabled:bg-gray-200"
                        >
                            Annuler
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};