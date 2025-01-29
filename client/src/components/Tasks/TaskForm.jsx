import React, { useState, useEffect } from 'react';
import { createTask } from '../../services/apiService';
import { syncTaskWithBacklog } from '../../utils/CalendarUtils';

export const TaskForm = ({
    isOpen,
    onClose,
    selectedDates,
    selectedTask,
    resources = [], // Valeur par défaut
    statuses = [],
    onSubmit,
    fromBacklog
}) => {
    const defaultStartDate = new Date().toISOString().split('T')[0];
    const getInitialStatusId = (statuses) => {
        const entrantStatus = statuses.find(s => s.status_type.toLowerCase() === 'entrant');
        return entrantStatus ? entrantStatus.status_id : '';
    };
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        startDate: selectedDates?.start ? selectedDates.start.toISOString().split('T')[0] : defaultStartDate,
        endDate: selectedDates?.end ? selectedDates.end.toISOString().split('T')[0] : defaultStartDate,
        resourceId: selectedDates?.resourceId || '',
        status_id: getInitialStatusId(statuses)
    });

    // Effet pour initialiser le formulaire avec les valeurs de la tâche sélectionnée ou les dates sélectionnées
    useEffect(() => {
        if (selectedTask) {
            setFormData({
                title: selectedTask.title || '',
                description: selectedTask.description || '',
                startDate: new Date(selectedTask.start).toISOString().split('T')[0],
                endDate: new Date(selectedTask.end).toISOString().split('T')[0],
                resourceId: selectedTask.resourceId || '',
                status_id: selectedTask.status_id || selectedTask.status || getInitialStatusId(statuses)
            });
        } else if (selectedDates) {
            setFormData(prev => ({
                ...prev,
                startDate: new Date(selectedDates.start).toISOString().split('T')[0],
                endDate: new Date(selectedDates.end).toISOString().split('T')[0],
                resourceId: selectedDates.resourceId || ''
            }));
        }
    }, [selectedTask, selectedDates, statuses]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (fromBacklog && !formData.resourceId) {
            alert('Une ressource doit être sélectionnée');
            return;
        }

        const updatedTask = await onSubmit(formData, selectedTask?.id);

        if (fromBacklog && updatedTask) {
            // Créer une copie dans le calendrier
            const calendarTask = syncTaskWithBacklog(updatedTask, 'backlog');
            await createTask(calendarTask);
        }

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
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className="bg-white p-6 rounded-lg w-96 relative z-50 shadow-xl">
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
                            required
                        >
                            <option value="">Sélectionner une personne</option>
                            {resources.map(resource => (
                                <option key={`resource-${resource.id}`} value={resource.id}>
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
                            {statuses.map(status => (
                                <option
                                    key={`status-${status.status_id}`}
                                    value={status.status_id}
                                >
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