import React, { useState, useCallback, useEffect } from 'react';
import { X } from 'lucide-react';
import { ERROR_MESSAGES } from '../../constants/constants';

export const TaskForm = ({
    isOpen,
    onClose,
    selectedDates,
    selectedTask,
    resources = [],
    statuses = [],
    onSubmit: handleTaskSubmit
}) => {

    const formatDateForInput = useCallback((date) => {
        if (!date) return '';

        const d = new Date(date);

        // Vérifier si la date est valide
        if (isNaN(d.getTime())) return '';

        // Utiliser les méthodes UTC pour éviter les décalages de fuseau horaire
        const year = d.getUTCFullYear();
        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');

        // Retourner au format YYYY-MM-DD pour l'élément input type="date"
        return `${year}-${month}-${day}`;
    }, []);


    const getInitialFormData = useCallback(() => {


        if (selectedTask) {
            const isAssigned = selectedTask.start && selectedTask.end;

            let startDateStr, endDateStr;

            if (isAssigned) {

                const startDate = new Date(selectedTask.start);
                let endDate;

                if (selectedTask.extendedProps?.inclusiveEndDate) {
                    endDate = new Date(selectedTask.extendedProps.inclusiveEndDate);
                } else if (selectedTask.end) {
                    endDate = new Date(selectedTask.end);
                }
                else {
                    endDate = new Date(startDate);
                }

                // Formater en YYYY-MM-DD pour input type="date"
                startDateStr = startDate.toISOString().split('T')[0];
                endDateStr = endDate.toISOString().split('T')[0];
            } else {
                startDateStr = '';
                endDateStr = '';
            }

            // Vérifier si la propriété isConge existe
            const isConge = (selectedTask.isConge ?? false) || (selectedTask.title === 'CONGE');

            return {
                id: selectedTask.id,
                title: selectedTask.title || '',
                description: selectedTask.description || selectedTask.extendedProps?.description || '',
                startDate: startDateStr,
                endDate: endDateStr,
                resourceId: selectedTask.resourceId || (selectedDates ? selectedDates.resourceId : '') || '',
                statusId: selectedTask.statusId || selectedTask.extendedProps?.statusId || '2',
                isConge: isConge
            };
        }

        // Si on crée une nouvelle tâche depuis le calendrier
        if (selectedDates && !selectedTask) {
            return {
                title: '',
                description: '',
                startDate: formatDateForInput(selectedDates.start),
                endDate: formatDateForInput(selectedDates.start), // Même jour par défaut
                resourceId: selectedDates.resourceId || '',
                statusId: selectedDates.resourceId ? '2' : '',
                isConge: false
            };
        }

        // Cas par défaut (nouvelle tâche sans contexte)
        return {
            title: '',
            description: '',
            startDate: '',
            endDate: '',
            resourceId: '',
            statusId: '',
            isConge: false
        };
    }, [selectedDates, selectedTask, formatDateForInput]);


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
                        newData.statusId = '1';
                    }
                }
            }

            if (name === 'resourceId') {
                if (value !== '') {
                    // Si une ressource est sélectionnée, on met le statut à "En cours"
                    newData.statusId = '2';
                } else {
                    // Si la ressource est désélectionnée
                    // et que le statut est "En cours", on change le statut à "Entrant"
                    if (newData.statusId === '2' && !newData.isConge) {
                        newData.statusId = '1';
                    }
                }
            }

            // Si on change le statut à "En cours" mais qu'il n'y a pas de ressource
            if (name === 'statusId' && value === '2' && !newData.resourceId && !newData.isConge) {
                // Afficher un message pour demander à l'utilisateur d'attribuer une ressource
                setTimeout(() => {
                    setErrors(prevErrors => ({
                        ...prevErrors,
                        resourceId: 'Veuillez attribuer une ressource pour une tâche en cours'
                    }));
                }, 0);
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

        // Rendre les dates obligatoires uniquement si une ressource est sélectionnée
        if (formData.resourceId) {
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
        }

        if (formData.statusId === '2' && !formData.resourceId) {
            newErrors.resourceId = 'Une ressource est requise pour une tâche en cours';
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            setIsSubmitting(false);
            return;
        }

        setIsSubmitting(true);
        try {

            // Les dates sont déjà au format YYYY-MM-DD comme attendu
            const taskData = {
                ...formData,
                start: formData.startDate,
                end: formData.endDate
            };

            // Appeler la fonction de soumission
            await handleTaskSubmit(taskData);
            onClose();
        } catch (error) {
            console.error('Error:', error);
            setErrors(prev => ({
                ...prev,
                submit: 'Une erreur est survenue lors de la soumission'
            }));
        } finally {
            setIsSubmitting(false);
        }
    };

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
                                className='w-full p-2 border rounded disabled:bg-gray-200 disabled:text-gray-500 disabled:border-gray-300 disabled:cursor-not-allowed'
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
                                <option value="">Sélectionner un owner</option>
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
                                <label htmlFor="startDate" className="block mb-1">
                                    Date de début{formData.resourceId ? ' *' : ''}
                                </label>
                                <input
                                    type="date"
                                    id="startDate"
                                    name="startDate"
                                    value={formData.startDate}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded"
                                    required={!!formData.resourceId}
                                />
                                {errors.startDate && (
                                    <span className="text-red-500 text-sm">{errors.startDate}</span>
                                )}
                            </div>

                            <div>
                                <label htmlFor="endDate" className="block mb-1">
                                    Date de fin{formData.resourceId ? ' *' : ''}
                                </label>
                                <input
                                    type="date"
                                    id="endDate"
                                    name="endDate"
                                    value={formData.endDate}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded"
                                    required={!!formData.resourceId}
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
                                className='w-full p-2 border rounded disabled:bg-gray-200 disabled:text-gray-500 disabled:border-gray-300 disabled:cursor-not-allowed'
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