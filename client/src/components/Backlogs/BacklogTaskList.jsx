import React, { useMemo } from 'react';
import { AlertCircle } from 'lucide-react';
import { BacklogContainer } from './BacklogContainer';
import { STATUS_TYPES } from '../../constants/constants';

export const BacklogTaskList = ({ 
    statuses = [], 
    tasks = [], 
    onStatusUpdate, 
    resources = [], 
    onTaskClick,
    className = ''
}) => {
    // Définir l'ordre des statuts de manière statique
    const statusOrder = useMemo(() => [
        STATUS_TYPES.ENTRANT,
        STATUS_TYPES.WIP,
        STATUS_TYPES.EN_ATTENTE,
        STATUS_TYPES.DONE,
    ], []); // L'ordre ne change jamais, donc pas besoin de dépendances

    // Mémoriser les statuts triés
    const sortedStatuses = useMemo(() => {
        if (!Array.isArray(statuses) || statuses.length === 0) return [];

        return [...statuses].sort((a, b) => {
            const orderA = statusOrder.indexOf(a.statusType.toLowerCase());
            const orderB = statusOrder.indexOf(b.statusType.toLowerCase());
            // Si le statut n'est pas dans l'ordre prédéfini, le mettre à la fin
            return (orderA === -1 ? Infinity : orderA) - (orderB === -1 ? Infinity : orderB);
        });
    }, [statuses, statusOrder]);

    // Mémoriser le filtrage des tâches par statut
    const getFilteredTasks = useMemo(() => {
        return (statusId) => {
            if (!Array.isArray(tasks)) return [];
            
            return tasks.filter(task => {
                if (!task?.statusId) return false;
                const taskStatusId = task.statusId;
                const compareStatusId = parseInt(statusId);
                return taskStatusId === compareStatusId;
            });
        };
    }, [tasks]);

    // Vérifier s'il y a des données valides
    if (!Array.isArray(statuses) || statuses.length === 0) {
        return (
            <div className="p-4 bg-yellow-50 text-yellow-700 rounded-lg flex items-center gap-2">
                <AlertCircle size={20} />
                <span>Aucun statut disponible</span>
            </div>
        );
    }

    // Calculer des statistiques générales
    const totalTasks = tasks.length;
    const doneStatusId = sortedStatuses.find(s => 
        s.statusType.toLowerCase() === STATUS_TYPES.DONE
    )?.statusId;
    const completedTasks = doneStatusId ? getFilteredTasks(doneStatusId).length : 0;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return (
        <div className={`bg-gray-100 p-4 ${className}`}>
            <div className="mb-4 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                    <span>{totalTasks} tâche{totalTasks !== 1 ? 's' : ''} au total</span>
                    {totalTasks > 0 && (
                        <span className="ml-2">• {completionRate}% terminées</span>
                    )}
                </div>
            </div>

            <div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
                role="region"
                aria-label="Liste des tâches par statut"
            >
                {sortedStatuses.map(status => {
                    const statusId = status.statusId;
                    const statusName = status.statusType;
                    const filteredTasks = getFilteredTasks(statusId);
                    const isWip = statusName.toLowerCase() === STATUS_TYPES.WIP;

                    return (
                        <BacklogContainer
                            key={`backlog-${statusId}`}
                            status={statusId}
                            statusName={statusName}
                            tasks={filteredTasks}
                            onStatusUpdate={onStatusUpdate}
                            resources={resources}
                            statuses={statuses}
                            onTaskClick={onTaskClick}
                            className={`
                                ${isWip ? 'border-l-4 border-blue-400' : ''}
                                ${filteredTasks.length === 0 ? 'opacity-75' : ''}
                            `}
                        />
                    );
                })}
            </div>

            {tasks.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    Aucune tâche disponible
                </div>
            )}
        </div>
    );
};