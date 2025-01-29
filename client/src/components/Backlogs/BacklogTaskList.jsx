import { BacklogContainer } from './BacklogContainer';

export const BacklogTaskList = ({ statuses, tasks, onStatusUpdate, resources, onTaskClick }) => {
    const filterTasksByStatus = (tasks, statusId) => {
        // Log pour voir les statuts disponibles
        console.log('Available statuses:', statuses.map(s => ({
            id: s.status_id,
            type: s.status_type
        })));

        return tasks.filter(task => {
            // Log de la tâche complète
            console.log('Full task data:', task);

            // Log des données de status brutes
            console.log('Raw status data:', {
                taskStatus: task.status,
                taskStatusId: task.status_id,
                compareStatusId: statusId
            });

            const taskStatusId = task.status_id;
            const compareStatusId = parseInt(statusId);

            console.log('Comparing task status:', {
                taskId: task.id,
                taskStatusId,
                compareStatusId,
                matches: taskStatusId === compareStatusId
            });

            return taskStatusId === compareStatusId;
        });
    };

    return (
        <div className="bg-gray-100 p-4">
            <div className="flex gap-4">
                {statuses.map(status => {
                    console.log('Processing backlog for status:', status);
                    
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