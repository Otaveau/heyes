import { useState, useCallback, useMemo, useEffect } from 'react';

export const useTaskBoardState = (externalTasks = [], handleExternalTaskClick) => {
  // État pour les tâches du tableau
  const [boardTasks, setBoardTasks] = useState([]);
  
  // État pour les tâches filtrées par statut
  const [filteredBoardTasks, setFilteredBoardTasks] = useState({});
  
  // Configuration du tri actuel
  const [sortConfig, setSortConfig] = useState({ key: 'title', direction: 'ascending' });
  
  // Filtres appliqués aux tâches
  const [filters, setFilters] = useState({
    statusId: '',
    // Autres filtres possibles : priorité, assigné à, etc.
  });
  
  // Terme de recherche
  const [searchTerm, setSearchTerm] = useState('');

  // Initialiser les tâches du tableau à partir des tâches externes
  useEffect(() => {
    setBoardTasks(externalTasks);
  }, [externalTasks]);

  // Fonction pour trier les tâches
  const handleSortClick = useCallback((key) => {
    setSortConfig(prevSortConfig => {
      if (prevSortConfig.key === key) {
        return {
          key,
          direction: prevSortConfig.direction === 'ascending' ? 'descending' : 'ascending'
        };
      }
      return { key, direction: 'ascending' };
    });
  }, []);

  // Fonction pour changer les filtres
  const handleFilterChange = useCallback((filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  }, []);

  // Fonction pour changer le terme de recherche
  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  // Fonction pour réinitialiser tous les filtres
  const resetFilters = useCallback(() => {
    setFilters({
      statusId: '',
      // Réinitialiser les autres filtres
    });
    setSearchTerm('');
  }, []);

  // Fonction pour filtrer les tâches par statut
  const filterTasksByStatus = useCallback(() => {
    // Appliquer les filtres et la recherche
    const filteredTasks = boardTasks.filter(task => {
      const taskStatusId = task.statusId || task.extendedProps?.statusId;
      
      // Filtrer par statut si un filtre est actif
      if (filters.statusId && taskStatusId !== filters.statusId) {
        return false;
      }
      
      // Filtrer par terme de recherche
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const titleMatch = task.title?.toLowerCase().includes(searchLower);
        const descMatch = task.description?.toLowerCase().includes(searchLower) || 
                          task.extendedProps?.description?.toLowerCase().includes(searchLower);
        
        if (!titleMatch && !descMatch) {
          return false;
        }
      }
      
      return true;
    });

    // Trier les tâches filtrées
    const sortedTasks = [...filteredTasks].sort((a, b) => {
      if (sortConfig.key === 'title') {
        const aValue = a.title || '';
        const bValue = b.title || '';
        
        if (sortConfig.direction === 'ascending') {
          return aValue.localeCompare(bValue);
        } else {
          return bValue.localeCompare(aValue);
        }
      }
      return 0;
    });

    // Grouper par statut
    const tasksByStatus = {};
    sortedTasks.forEach(task => {
      const statusId = task.statusId || task.extendedProps?.statusId;
      if (!tasksByStatus[statusId]) {
        tasksByStatus[statusId] = [];
      }
      tasksByStatus[statusId].push(task);
    });

    setFilteredBoardTasks(tasksByStatus);
  }, [boardTasks, filters, searchTerm, sortConfig]);

  // Appeler filterTasksByStatus lorsque les dépendances changent
  useEffect(() => {
    filterTasksByStatus();
  }, [boardTasks, filters, searchTerm, sortConfig, filterTasksByStatus]);

  // Fonction pour gérer le clic sur une tâche
  const handleTaskClick = useCallback((task) => {
    if (handleExternalTaskClick) {
      handleExternalTaskClick(task);
    }
  }, [handleExternalTaskClick]);

  return {
    boardTasks,
    filteredBoardTasks,
    sortConfig,
    filters,
    searchTerm,
    handleTaskClick,
    handleSortClick,
    handleFilterChange,
    handleSearchChange,
    resetFilters,
    filterTasksByStatus
  };
};