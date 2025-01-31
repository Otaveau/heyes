import React, { useState, useEffect } from 'react';
import { formatUTCDate } from '../../utils/dateUtils';

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
    
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        startDate: formatUTCDate(selectedDates?.start) || defaultStartDate,
        endDate: formatUTCDate(selectedDates?.end) || defaultStartDate,
        resourceId: selectedDates?.resourceId || '',
        status_id: selectedDates?.resourceId ? '2' : ''
    });

    useEffect(() => {
        if (selectedTask) {
            setFormData({
                title: selectedTask.title || '',
                description: selectedTask.description || '',
                startDate: formatUTCDate(selectedTask.start) || defaultStartDate,
                endDate: formatUTCDate(selectedTask.end) || defaultStartDate,
                resourceId: selectedTask.resourceId || '',
                status_id: selectedTask.resourceId ? '2' : (selectedTask.status_id || '')
            });
        } else if (selectedDates) {
            setFormData(prev => ({
                ...prev,
                startDate: formatUTCDate(selectedDates.start) || defaultStartDate,
                endDate: formatUTCDate(selectedDates.end) || defaultStartDate,
                resourceId: selectedDates.resourceId || '',
                status_id: selectedDates.resourceId ? '2' : prev.status_id
            }));
        }
    }, [selectedTask, selectedDates, defaultStartDate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        await onSubmit(formData, selectedTask?.id);
        onClose();
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = {
                ...prev,
                [name]: value
            };
            if (name === 'resourceId' && value !== '') { newData.status_id = '2'; }
            return newData;
        });
    };

    if (!isOpen) return null;

    const getSelectClassName = (isDisabled) => {
        const baseClasses = "w-full border rounded p-2";
        if (isDisabled) {
            return `${baseClasses} bg-gray-100 cursor-not-allowed text-gray-700 border-gray-300`;
        }
        return baseClasses;
    };

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
                            value={formData.startDate || ''}
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
                            value={formData.endDate || ''}
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
                            className={getSelectClassName(formData.resourceId !== '')}
                            required
                            disabled={formData.resourceId !== ''}
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