import { BacklogContainer } from './BacklogContainer';
import {STATUS_TYPES} from '../../constants/constants';

export const BacklogTaskList = ({ statuses, tasks, onStatusUpdate, resources, onTaskClick }) => {

    const statusOrder = [
        STATUS_TYPES.ENTRANT,
        STATUS_TYPES.WIP,
        STATUS_TYPES.EN_ATTENTE,
        STATUS_TYPES.DONE, 
        ];

    // Fonction pour obtenir l'index d'ordre d'un statut
    const getStatusOrderIndex = (statusType) => {
        return statusOrder.indexOf(statusType.toLowerCase());
    };

    // Trier les statuts selon l'ordre défini
    const sortedStatuses = [...statuses].sort((a, b) => {
        const orderA = getStatusOrderIndex(a.status_type);
        const orderB = getStatusOrderIndex(b.status_type);
        return orderA - orderB;
    });

    const filterTasksByStatus = (tasks, statusId) => {
        return tasks.filter(task => {
            const taskStatusId = parseInt(task.status_id || task.status);
            const compareStatusId = parseInt(statusId);

            return taskStatusId === compareStatusId;
        });
    };
    

    return (
        <div className="bg-gray-100 p-4">
            <div className="flex gap-4">
                {sortedStatuses.map(status => {
                    
                    const statusId = status.status_id;
                    const statusName = status.status_type;
                    
                    const filteredTasks = filterTasksByStatus(tasks, statusId);

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
                        />
                    );
                })}
            </div>
        </div>
    );
};