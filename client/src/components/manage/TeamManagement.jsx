import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { Trash2, Plus, Loader2, Save, X } from 'lucide-react';
import { fetchTeams, deleteTeam, createTeam, updateTeam } from '../../services/api/teamService';
import ConfirmationModal from '../common/ConfirmationModal';

export const TeamManagement = () => {
  const [teams, setTeams] = useState([]);
  const [newTeam, setNewTeam] = useState({ name: '' });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedTeam, setEditedTeam] = useState({ name: '' });

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
      await createTeam(newTeam);
      await loadTeams();
      setNewTeam({ name: '' });
    } catch (error) {
      console.error('Error creating team:', error);

      if (error.message && error.message.includes('validation')) {
        setError(error.message);
      } else if (error.status === 401) {
        window.location.href = '/login';
        return;
      } else {
        setError('Erreur lors de la création de l\'équipe. Veuillez réessayer.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteModal = (team, e) => {
    e.stopPropagation(); // Empêche le clic de sélectionner l'équipe
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

      // Si l'équipe supprimée était sélectionnée, désélectionner
      if (selectedTeam && selectedTeam.team_id === teamToDelete.team_id) {
        setSelectedTeam(null);
        setEditMode(false);
      }

      await loadTeams();
    } catch (error) {
      console.error('Error deleting team:', error);
      setError('Erreur lors de la suppression de l\'équipe. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
      closeDeleteModal();
    }
  };

  const handleTeamSelect = (team) => {
    // Si on clique sur l'équipe déjà sélectionnée, on désélectionne
    if (selectedTeam && selectedTeam.team_id === team.team_id) {
      setSelectedTeam(null);
      setEditMode(false);
    } else {
      setSelectedTeam(team);
      setEditedTeam({ ...team });
      setEditMode(false); // On commence par juste sélectionner, pas éditer
    }
  };

  const handleEditMode = (e) => {
    e.preventDefault();
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    // Remettre les valeurs originales
    setEditedTeam({ ...selectedTeam });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editedTeam.name.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Utilisation du service updateTeam
      const updatedTeam = await updateTeam(editedTeam.team_id, {
        name: editedTeam.name.trim()
      });

      // Mettre à jour la liste complète des équipes
      await loadTeams();

      // Mettre à jour l'équipe sélectionnée avec les données mises à jour
      setSelectedTeam(updatedTeam);

      // Sortir du mode édition
      setEditMode(false);
    } catch (error) {
      console.error('Error updating team:', error);

      if (error.message && error.message.includes('validation')) {
        setError(error.message);
      } else if (error.status === 401) {
        window.location.href = '/login';
        return;
      } else {
        setError('Erreur lors de la mise à jour de l\'équipe. Veuillez réessayer.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 min-h-screen w-1/2">
      <h2 className="text-2xl text-center font-bold mb-6">Gestion des équipes</h2>

      {/* Formulaire d'ajout d'équipe */}
      <form onSubmit={handleSubmit} className="flex justify-center mb-8">
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

      {/* Conteneur principal qui change de layout basé sur la sélection d'équipe */}
      <div className={`${selectedTeam ? 'grid gap-8 grid-cols-1 md:grid-cols-2' : 'flex justify-center'}`}>
        {/* Liste des équipes - sera centrée quand aucune équipe n'est sélectionnée */}
        <div className={`space-y-4 ${!selectedTeam ? 'max-w-lg w-full' : ''}`}>
          <h3 className="text-lg font-semibold">Liste des équipes</h3>

          {isLoading && !isSubmitting ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : teams.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              Aucune équipe disponible. Créez votre première équipe.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-1">
              {teams.map(team => (
                <Card
                  key={team.team_id}
                  className={`p-4 cursor-pointer transition-colors ${selectedTeam && selectedTeam.team_id === team.team_id
                      ? 'bg-blue-50 border-blue-300'
                      : 'hover:bg-gray-50'
                    }`}
                  onClick={() => handleTeamSelect(team)}
                >
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">{team.name}</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => openDeleteModal(team, e)}
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
        </div>

        {/* Détails de l'équipe sélectionnée */}
        {selectedTeam && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Détails de l'équipe</h3>
            <Card className="p-6">
              {editMode ? (
                <form onSubmit={handleSaveEdit} className="space-y-4">
                  <div>
                    <label htmlFor="teamName" className="block text-sm font-medium text-gray-700 mb-1">
                      Nom de l'équipe
                    </label>
                    <Input
                      id="teamName"
                      type="text"
                      value={editedTeam.name}
                      onChange={(e) => setEditedTeam({ ...editedTeam, name: e.target.value })}
                      placeholder="Nom de l'équipe"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={isSubmitting}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting || !editedTeam.name.trim()}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enregistrement...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Enregistrer
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Nom</p>
                    <p className="font-medium">{selectedTeam.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">ID</p>
                    <p className="font-medium">{selectedTeam.team_id}</p>
                  </div>
                  {/* Ajouter d'autres détails si nécessaire */}
                  <div className="pt-2">
                    <Button onClick={handleEditMode}>
                      Modifier
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>

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