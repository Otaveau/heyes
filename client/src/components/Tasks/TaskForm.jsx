import React, { useState, useEffect, useCallback } from 'react';

export const TaskForm = ({ 
    isOpen, 
    onClose, 
    selectedDates, 
    selectedTask, 
    resources = [], 
    statuses = [], 
    onSubmit 
}) => {
    const defaultStartDate = new Date().toISOString().split('T')[0];
    
    const formatDate = useCallback((date) => {
        if (!date) return defaultStartDate;
        
        try {
            // Si la date est une chaîne ISO, on l'utilise directement
            if (typeof date === 'string') {
                // Vérifier si la date est déjà au format YYYY-MM-DD
                if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    return date;
                }
                // Sinon, on essaie de la convertir
                return new Date(date).toISOString().split('T')[0];
            }
            // Si c'est un objet Date
            if (date instanceof Date) {
                return date.toISOString().split('T')[0];
            }
        } catch (error) {
            console.error('Error formatting date:', error);
            return defaultStartDate;
        }
        return defaultStartDate;
    }, [defaultStartDate]);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        startDate: formatDate(selectedDates?.start),
        endDate: formatDate(selectedDates?.end),
        resourceId: selectedDates?.resourceId || '',
        status_id: ''
    });

    useEffect(() => {
        if (selectedTask) {
            setFormData({
                title: selectedTask.title || '',
                description: selectedTask.description || '',
                startDate: formatDate(selectedTask.start),
                endDate: formatDate(selectedTask.end),
                resourceId: selectedTask.resourceId || '',
                status_id: selectedTask.status_id || ''
            });
        } else if (selectedDates) {
            setFormData(prev => ({
                ...prev,
                startDate: formatDate(selectedDates.start),
                endDate: formatDate(selectedDates.end),
                resourceId: selectedDates.resourceId || ''
            }));
        }
    }, [selectedTask, selectedDates, formatDate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        await onSubmit(formData, selectedTask?.id);
        onClose();
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-96 relative">
                <h2 className="text-xl font-bold mb-4">
                    {selectedTask ? 'Modifier la tâche' : 'Nouvelle tâche'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block mb-1">Titre</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className="w-full border rounded p-2"
                            required
                        />
                    </div>
                    <div>
                        <label className="block mb-1">Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="w-full border rounded p-2"
                        />
                    </div>
                    <div>
                        <label className="block mb-1">Assigné à</label>
                        <select
                            name="resourceId"
                            value={formData.resourceId}
                            onChange={handleChange}
                            className="w-full border rounded p-2"
                        >
                            <option value="">Sélectionner une personne</option>
                            {resources.map(resource => (
                                <option key={resource.id} value={resource.id}>
                                    {resource.title}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block mb-1">Date de début</label>
                        <input
                            type="date"
                            name="startDate"
                            value={formData.startDate}
                            onChange={handleChange}
                            className="w-full border rounded p-2"
                            required
                        />
                    </div>
                    <div>
                        <label className="block mb-1">Date de fin</label>
                        <input
                            type="date"
                            name="endDate"
                            value={formData.endDate}
                            onChange={handleChange}
                            className="w-full border rounded p-2"
                            required
                        />
                    </div>
                    <div>
                        <label className="block mb-1">Statut</label>
                        <select
                            name="status_id"
                            value={formData.status_id}
                            onChange={handleChange}
                            className="w-full border rounded p-2"
                            required
                        >
                            <option value="">Sélectionner un statut</option>
                            {statuses.map(status => (
                                <option key={status.status_id} value={status.status_id}>
                                    {status.status_type}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex gap-4">
                        <button
                            type="submit"
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        >
                            {selectedTask ? 'Modifier' : 'Créer'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                        >
                            Annuler
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};