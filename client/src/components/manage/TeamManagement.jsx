import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { Trash2, Plus, Loader2 } from 'lucide-react';
import { fetchTeams, deleteTeam, createTeam } from '../../services/api/teamService';
import ConfirmationModal from '../common/ConfirmationModal';

export const TeamManagement = () => {
  const [teams, setTeams] = useState([]);
  const [newTeam, setNewTeam] = useState({ name: '' });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const loadTeams = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchTeams();
      setTeams(data);
    } catch (error) {
      console.error('Error fetching teams:', error);
      setError('Impossible de charger les équipes. Veuillez réessayer plus tard.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTeams();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newTeam.name.trim()) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Utilisation du service createTeam
      await createTeam(newTeam);
      await loadTeams();
      setNewTeam({ name: '' });
    } catch (error) {
      console.error('Error creating team:', error);
      
      // Gestion spécifique des erreurs de validation
      if (error.message && error.message.includes('validation')) {
        setError(error.message);
      } else if (error.status === 401) {
        // Redirection en cas d'authentification expirée
        window.location.href = '/login';
        return;
      } else {
        setError('Erreur lors de la création de l\'équipe. Veuillez réessayer.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteModal = (team) => {
    setTeamToDelete(team);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setTeamToDelete(null);
  };

  const confirmDelete = async () => {
    if (!teamToDelete) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await deleteTeam(teamToDelete.team_id);
      await loadTeams();
    } catch (error) {
      console.error('Error deleting team:', error);
      setError('Erreur lors de la suppression de l\'équipe. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
      closeDeleteModal();
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Gestion des équipes</h2>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-4">
          <Input
            type="text"
            value={newTeam.name}
            onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
            placeholder="Nom de l'équipe"
            className="w-full max-w-sm"
            required
            disabled={isSubmitting}
          />
          <Button 
            type="submit" 
            disabled={isSubmitting || !newTeam.name.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Ajout...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter
              </>
            )}
          </Button>
        </div>
        {error && <p className="mt-2 text-red-500 text-sm">{error}</p>}
      </form>

      {isLoading && !isSubmitting ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : teams.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          Aucune équipe disponible. Créez votre première équipe.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teams.map(team => (
            <Card key={team.team_id} className="p-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">{team.name}</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openDeleteModal(team)}
                  className="text-red-500 hover:text-red-700"
                  disabled={isLoading}
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmationModal 
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer l'équipe "${teamToDelete?.name}" ?`}
      />
    </div>
  );
};