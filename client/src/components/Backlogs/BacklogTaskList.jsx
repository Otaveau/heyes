import React, { useMemo, useEffect } from 'react';
import { Draggable } from '@fullcalendar/interaction';
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

    const statusOrder = useMemo(() => [
        STATUS_TYPES.ENTRANT,
        STATUS_TYPES.WIP,
        STATUS_TYPES.EN_ATTENTE,
        STATUS_TYPES.DONE,
    ], []);


    useEffect(() => {
        const taskElements = document.querySelectorAll('.task-card');
        const draggables = [];
    
        // Nettoyer les anciens draggables d'abord
        taskElements.forEach(el => {
            if (el._dragInstance) {
                el._dragInstance.destroy();
                delete el._dragInstance;
            }
        });
    
        // Créer les nouveaux draggables
        taskElements.forEach(el => {
            const draggable = new Draggable(el, {
                // ... options
            });
            el._dragInstance = draggable;  // Garder une référence
            draggables.push(draggable);
        });
    
        return () => {
            draggables.forEach(draggable => {
                try {
                    draggable.destroy();
                } catch (error) {
                    console.warn('Error cleaning up draggable:', error);
                }
            });
        };
    }, [tasks]);


    const sortedStatuses = useMemo(() => {
        if (!Array.isArray(statuses) || statuses.length === 0) return [];
        return [...statuses].sort((a, b) => {
            const orderA = statusOrder.indexOf(a.statusType.toLowerCase());
            const orderB = statusOrder.indexOf(b.statusType.toLowerCase());
            return (orderA === -1 ? Infinity : orderA) - (orderB === -1 ? Infinity : orderB);
        });
    }, [statuses, statusOrder]);


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


    if (!Array.isArray(statuses) || statuses.length === 0) {
        return (
            <div className="p-4 bg-yellow-50 text-yellow-700 rounded-lg flex items-center gap-2">
                <AlertCircle size={20} />
                <span>Aucun statut disponible</span>
            </div>
        );
    }

    
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