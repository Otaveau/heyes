import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { Trash2, Plus, Loader2, Save, X, Palette } from 'lucide-react';
import { fetchTeams, deleteTeam, createTeam, updateTeam } from '../../services/api/teamService';
import ConfirmationModal from '../ui/confirmationModal';

// Import des fonctions de couleur centralisées
import { getTeamColor } from '../../utils/colorUtils';

export default function TeamManagement() {
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

  // Fonction pour obtenir l'ID formaté pour la cohérence des couleurs
  const getFormattedTeamId = (team) => {
    return `team_${team.team_id}`;
  };

  return (
    <div className="p-8 min-h-screen w-full md:w-4/5 lg:w-3/4 mx-auto bg-gray-50 dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-3xl text-center font-bold mb-8 pb-2 border-b-2 border-gray-200 dark:border-gray-700">Gestion des équipes</h2>

      {/* Formulaire d'ajout d'équipe */}
      <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm mb-10">
        <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Ajouter une équipe</h3>
        <form onSubmit={handleSubmit} className="flex flex-col items-center">
          <div className="flex gap-4 w-full max-w-md">
            <div className="flex-grow">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Nom de l'équipe</label>
              <Input
                type="text"
                value={newTeam.name}
                onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                placeholder="Nom de l'équipe"
                className="w-full border-gray-300 focus:ring-2 focus:ring-blue-500"
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="self-end">
              <Button
                type="submit"
                disabled={isSubmitting || !newTeam.name.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md shadow-sm transition-all duration-200 font-medium h-10"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Ajout...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-5 w-5" />
                    Ajouter
                  </>
                )}
              </Button>
            </div>
          </div>
          {error && <p className="mt-3 text-red-500 text-sm font-medium">{error}</p>}
        </form>
      </div>

      {/* Conteneur principal qui change de layout basé sur la sélection d'équipe */}
      <div className={`${selectedTeam ? 'grid gap-10 grid-cols-1 md:grid-cols-2' : 'flex justify-center'}`}>
        {/* Liste des équipes - sera centrée quand aucune équipe n'est sélectionnée */}
        <div className={`space-y-6 ${!selectedTeam ? 'max-w-2xl w-full' : ''}`}>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Liste des équipes</h3>
            <div className="bg-blue-50 text-blue-700 text-sm py-1 px-3 rounded-full font-medium">
              {teams.length} {teams.length > 1 ? 'équipes' : 'équipe'}
            </div>
          </div>

          {isLoading && !isSubmitting ? (
            <div className="flex justify-center items-center py-16 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
              <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
            </div>
          ) : teams.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-700 rounded-lg shadow-sm text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600">
              <div className="flex flex-col items-center space-y-3">
                <div className="p-3 bg-gray-100 dark:bg-gray-600 rounded-full">
                  <Trash2 className="h-8 w-8 text-gray-400 dark:text-gray-300" />
                </div>
                <p className="font-medium">Aucune équipe disponible</p>
                <p className="text-sm">Utilisez le formulaire ci-dessus pour créer votre première équipe</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-1">
              {teams.map(team => {
                // Obtenir l'ID formaté pour la cohérence des couleurs (team_XX)
                const formattedId = getFormattedTeamId(team);
                
                // Récupérer la couleur de l'équipe en utilisant notre fonction centralisée
                const teamColor = getTeamColor(formattedId);
                
                return (
                  <Card
                    key={team.team_id}
                    className={`p-0 cursor-pointer transition-all duration-200 hover:shadow-md overflow-hidden ${
                      selectedTeam && selectedTeam.team_id === team.team_id
                        ? 'shadow-md'
                        : ''
                    }`}
                    onClick={() => handleTeamSelect(team)}
                  >
                    <div className="flex">
                      {/* Bande de couleur */}
                      <div 
                        className="w-2"
                        style={{ backgroundColor: teamColor }}
                      ></div>
                      
                      <div className="flex-1 p-5">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            {/* Pastille de couleur */}
                            <div 
                              className="w-5 h-5 rounded-full mr-3 flex-shrink-0"
                              style={{ backgroundColor: teamColor }}
                            ></div>
                            <h3 className="font-semibold text-lg">{team.name}</h3>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => openDeleteModal(team, e)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
                            disabled={isLoading}
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Détails de l'équipe sélectionnée */}
        {selectedTeam && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Détails de l'équipe</h3>
            <Card className="p-6 shadow-md bg-white dark:bg-gray-700 overflow-hidden">
              {/* Bande de couleur en haut de la carte */}
              <div 
                className="h-2 -mx-6 -mt-6 mb-5"
                style={{ backgroundColor: getTeamColor(getFormattedTeamId(selectedTeam)) }}
              ></div>
              
              {editMode ? (
                <form onSubmit={handleSaveEdit} className="space-y-5">
                  <div>
                    <label htmlFor="teamName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                      className="w-full border-gray-300 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="pt-3 flex items-center gap-2">
                    <Palette className="h-5 w-5 text-gray-500" />
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      Couleur d'équipe: 
                      <span 
                        className="inline-block w-4 h-4 ml-2 rounded-full align-middle"
                        style={{ backgroundColor: getTeamColor(getFormattedTeamId(selectedTeam)) }}
                      ></span>
                    </div>
                    <div className="text-xs text-gray-500 ml-2">
                      (Cette couleur est utilisée pour toutes les tâches de l'équipe)
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={isSubmitting}
                      className="border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors duration-200 px-4 py-2 rounded-md"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting || !editedTeam.name.trim()}
                      className="bg-green-600 hover:bg-green-700 text-white transition-colors duration-200 px-4 py-2 rounded-md shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
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
                <div className="space-y-5">
                  <div className="bg-gray-50 dark:bg-gray-600 p-3 rounded-md">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Nom</p>
                    <div className="flex items-center mt-1">
                      <div 
                        className="w-4 h-4 rounded-full mr-2"
                        style={{ backgroundColor: getTeamColor(getFormattedTeamId(selectedTeam)) }}
                      ></div>
                      <p className="font-medium text-lg">{selectedTeam.name}</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-600 p-3 rounded-md">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">ID</p>
                    <p className="font-medium text-lg mt-1">{selectedTeam.team_id}</p>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-600 p-3 rounded-md">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Couleur d'équipe</p>
                    <div className="flex items-center mt-2">
                      <div 
                        className="w-6 h-6 rounded mr-3"
                        style={{ backgroundColor: getTeamColor(getFormattedTeamId(selectedTeam)) }}
                      ></div>
                      <code className="bg-white dark:bg-gray-700 px-2 py-1 rounded text-sm">
                        {getTeamColor(getFormattedTeamId(selectedTeam))}
                      </code>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Cette couleur et ses variantes sont utilisées pour toutes les tâches associées à cette équipe dans le calendrier.</p>
                  </div>
                  
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
                    <Button
                      onClick={handleEditMode}
                      className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4"
                    >
                      <Save className="mr-2 h-4 w-4" />
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