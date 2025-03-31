import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { Trash2, Plus, Loader2, Save, X } from 'lucide-react';
import { fetchOwners, deleteOwner, createOwner, updateOwner } from '../../services/api/ownerService';
import { fetchTeams } from '../../services/api/teamService';
import ConfirmationModal from '../ui/confirmationModal';

// Import des fonctions de couleur centralisées
import { getTeamColor, getContrastTextColor } from '../../utils/colorUtils';

export default function OwnerManagement() {
  const [owners, setOwners] = useState([]);
  const [newOwner, setNewOwner] = useState({
    name: '',
    teamId: ''
  });
  const [teams, setTeams] = useState([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [ownerToDelete, setOwnerToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedOwner, setEditedOwner] = useState({ name: '',  teamId: '' });

  // Utiliser useRef pour surveiller les changements de selectedOwner
  const previousSelectedOwner = useRef(null);

  useEffect(() => {
    // Afficher les détails du membre sélectionné dans la console
    if (selectedOwner && selectedOwner !== previousSelectedOwner.current) {
      previousSelectedOwner.current = selectedOwner;
    }
  }, [selectedOwner]);

  const loadOwners = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchOwners();
      setOwners(data);
    } catch (error) {
      console.error('Error fetching owners:', error);
      setError('Impossible de charger les membres. Veuillez réessayer plus tard.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTeams = async () => {
    try {
      const data = await fetchTeams();
      setTeams(data);
    } catch (error) {
      console.error('Error fetching teams:', error);
      setError('Impossible de charger les équipes. Veuillez réessayer plus tard.');
    }
  };

  useEffect(() => {
    loadOwners();
    loadTeams();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newOwner.name.trim() || !newOwner.teamId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Vérification si le name existe déjà
      const existingOwner = owners.find(owner => owner.name.toLowerCase() === newOwner.name.toLowerCase());
      if (existingOwner) {
        setError('Un membre avec ce nom existe déjà');
        setIsSubmitting(false);
        return;
      }

      const sanitizedOwner = {
        name: newOwner.name.trim(),
        teamId: newOwner.teamId ? parseInt(newOwner.teamId, 10) : null
      };

      // Utilisation du service createOwner
      await createOwner(sanitizedOwner);

      setNewOwner({ name: '',teamId: '' });

      await loadOwners();
    } catch (error) {
      console.error('Error creating owner:', error);

      if (error.message && error.message.includes('validation')) {
        setError(error.message);
      } else if (error.status === 401) {
        window.location.href = '/login';
        return;
      } else {
        setError('Erreur lors de la création du membre. Veuillez réessayer.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteModal = (owner, e) => {
    e.stopPropagation();
    setOwnerToDelete(owner);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setOwnerToDelete(null);
  };

  const confirmDelete = async () => {
    if (!ownerToDelete) return;

    setIsLoading(true);
    setError(null);

    try {
      // Obtenir l'ID correct pour la suppression
      const ownerId = ownerToDelete.id || ownerToDelete.owner_id || ownerToDelete.ownerId;

      // Utilisation du service deleteOwner
      await deleteOwner(ownerId);

      // Si le membre supprimé était sélectionné, désélectionner
      if (selectedOwner && (selectedOwner.id === ownerId || selectedOwner.owner_id === ownerId || selectedOwner.ownerId === ownerId)) {
        setSelectedOwner(null);
        setEditMode(false);
      }

      await loadOwners();
    } catch (error) {
      console.error('Error deleting owner:', error);

      if (error.status === 401) {
        window.location.href = '/login';
        return;
      } else {
        setError('Erreur lors de la suppression du membre. Veuillez réessayer.');
      }
    } finally {
      setIsLoading(false);
      closeDeleteModal();
    }
  };

  const handleOwnerSelect = (owner) => {
    // Vérifier si l'ID de l'owner est le même que celui de l'owner sélectionné
    const ownerId = owner.id || owner.owner_id || owner.ownerId;
    const selectedId = selectedOwner?.id || selectedOwner?.owner_id || selectedOwner?.ownerId;

    if (selectedOwner && ownerId === selectedId) {
      setSelectedOwner(null);
      setEditMode(false);
    } else {
      // Normaliser l'objet owner pour assurer la compatibilité avec l'UI
      const normalizedOwner = {
        ...owner,
        // Assurer que les propriétés requises sont présentes
        id: ownerId,
        teamId: owner.teamId || owner.team_id
      };

      setSelectedOwner(normalizedOwner);
      setEditedOwner({
        ...normalizedOwner,
        teamId: (owner.teamId || owner.team_id || '').toString()
      });
      setEditMode(false);
    }
  };

  const handleEditMode = (e) => {
    e.preventDefault();
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    // Remettre les valeurs originales
    setEditedOwner({
      ...selectedOwner,
      teamId: (selectedOwner.teamId || selectedOwner.team_id || '').toString()
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editedOwner.name.trim() || !editedOwner.teamId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Vérifier si le nom existe déjà et n'appartient pas à cet owner
      const ownerId = editedOwner.id || editedOwner.owner_id || editedOwner.ownerId;

      const existingOwner = owners.find(owner => {
        const ownerName = owner.name.toLowerCase();
        const editedName = editedOwner.name.toLowerCase();
        return ownerName === editedName;
      });

      if (existingOwner) {
        setError('Un autre membre utilise déjà ce nom');
        setIsSubmitting(false);
        return;
      }

      const sanitizedOwner = {
        name: editedOwner.name.trim(),
        teamId: editedOwner.teamId ? parseInt(editedOwner.teamId, 10) : null
      };

      const updatedOwner = await updateOwner(ownerId, sanitizedOwner);

      // Récupérer le nom de l'équipe pour l'ajouter aux informations du membre
      const teamId = updatedOwner.teamId || updatedOwner.team_id;
      const teamName = getTeamNameById(teamId);

      // Normaliser les propriétés pour être cohérent dans l'UI
      const normalizedOwner = {
        ...updatedOwner,
        id: updatedOwner.id || updatedOwner.owner_id,
        ownerId: updatedOwner.owner_id,
        teamId: teamId,
        teamName: teamName
      };

      // Mettre à jour le membre sélectionné
      setSelectedOwner(normalizedOwner);

      // Sortir du mode édition
      setEditMode(false);

      // Recharger la liste des membres
      await loadOwners();
    } catch (error) {
      console.error('Error updating owner:', error);

      if (error.message && error.message.includes('validation')) {
        setError(error.message);
      } else if (error.status === 401) {
        window.location.href = '/login';
        return;
      } else {
        setError('Erreur lors de la mise à jour du membre. Veuillez réessayer.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTeamNameById = (teamId) => {
    if (!teamId) return 'N/A';

    // Convertir en nombre si c'est une chaîne
    const parsedTeamId = typeof teamId === 'string' ? parseInt(teamId, 10) : teamId;

    const team = teams.find(t => {
      // Vérifier à la fois team_id et id
      const currentTeamId = t.team_id !== undefined ? t.team_id : t.id;
      return currentTeamId === parsedTeamId;
    });

    return team ? team.name : 'N/A';
  };

  // Get team color
  const getTeamColorById = (teamId) => {
    if (!teamId) return '#9CA3AF';
    const formattedTeamId = `team_${teamId}`;
    return getTeamColor(formattedTeamId);
  };

  return (
    <div className="p-8 min-h-screen w-full md:w-4/5 lg:w-3/4 mx-auto bg-gray-50 dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-3xl text-center font-bold mb-8 pb-2 border-b-2 border-gray-200 dark:border-gray-700">Gestion des membres</h2>

      {/* Formulaire d'ajout de membre */}
      <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm mb-10">
        <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Ajouter un membre</h3>
        <form onSubmit={handleSubmit} className="flex flex-col items-center">
          <div className="grid gap-4 md:grid-cols-2 w-full">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nom</label>
              <Input
                type="text"
                value={newOwner.name}
                onChange={(e) => setNewOwner({ ...newOwner, name: e.target.value })}
                placeholder="Nom du membre"
                required
                disabled={isSubmitting}
                className="w-full border-gray-300 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Équipe</label>
              <select
                value={newOwner.teamId}
                onChange={(e) => setNewOwner({ ...newOwner, teamId: e.target.value })}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white dark:border-gray-500"
                required
                disabled={isSubmitting}
              >
                <option key="default-new" value="">Sélectionner une équipe</option>
                {teams.map(team => {
                  const teamId = team.team_id || team.id;
                  return (
                    <option 
                      key={`new-${teamId}`} 
                      value={teamId}
                    >
                      {team.name}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
          <div className="mt-6">
            <Button
              type="submit"
              disabled={isSubmitting || !newOwner.name.trim() ||!newOwner.teamId}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-md shadow-sm transition-all duration-200 font-medium"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Ajout en cours...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-5 w-5" />
                  Ajouter un membre
                </>
              )}
            </Button>
            {error && <p className="mt-3 text-red-500 text-sm font-medium">{error}</p>}
          </div>
        </form>
      </div>

      {/* Conteneur principal qui change de layout basé sur la sélection d'un membre */}
      <div className={`${selectedOwner ? 'grid gap-10 grid-cols-1 md:grid-cols-2' : 'flex justify-center'}`}>
        {/* Liste des membres - sera centrée quand aucun membre n'est sélectionné */}
        <div className={`space-y-6 ${!selectedOwner ? 'max-w-2xl w-full' : ''}`}>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Liste des membres</h3>
            <div className="bg-blue-50 text-blue-700 text-sm py-1 px-3 rounded-full font-medium">
              {owners.length} {owners.length > 1 ? 'membres' : 'membre'}
            </div>
          </div>

          {isLoading && !isSubmitting ? (
            <div className="flex justify-center items-center py-16 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
              <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
            </div>
          ) : owners.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-700 rounded-lg shadow-sm text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600">
              <div className="flex flex-col items-center space-y-3">
                <div className="p-3 bg-gray-100 dark:bg-gray-600 rounded-full">
                  <Trash2 className="h-8 w-8 text-gray-400 dark:text-gray-300" />
                </div>
                <p className="font-medium">Aucun membre disponible</p>
                <p className="text-sm">Utilisez le formulaire ci-dessus pour créer votre premier membre</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-1">
              {owners.map(owner => {
                const ownerId = owner.id || owner.owner_id || owner.ownerId;
                const selectedId = selectedOwner?.id || selectedOwner?.owner_id || selectedOwner?.ownerId;
                const teamId = owner.teamId || owner.team_id;
                const teamColor = getTeamColorById(teamId);
                
                return (
                  <Card
                    key={ownerId}
                    className={`p-0 cursor-pointer transition-all duration-200 hover:shadow-md overflow-hidden ${
                      selectedOwner && ownerId === selectedId
                        ? 'shadow-md'
                        : ''
                    }`}
                    onClick={() => handleOwnerSelect(owner)}
                  >
                    <div className="flex">
                      {/* Bande de couleur de l'équipe */}
                      <div 
                        className="w-2"
                        style={{ backgroundColor: teamColor }}
                      ></div>
                      
                      <div className="flex-1 p-5">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg">{owner.name}</h3>
                            <div className="mt-2 flex items-center">
                              {/* Pastille de couleur de l'équipe */}
                              <div 
                                className="w-3 h-3 rounded-full mr-1"
                                style={{ backgroundColor: teamColor }}
                              ></div>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                {owner.teamName || getTeamNameById(teamId)}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => openDeleteModal(owner, e)}
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

        {/* Détails du membre sélectionné */}
        {selectedOwner && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Détails du membre</h3>
            <Card className="p-6 shadow-md bg-white dark:bg-gray-700 overflow-hidden">
              {/* Bande de couleur en haut de la carte (couleur de l'équipe) */}
              <div 
                className="h-2 -mx-6 -mt-6 mb-5"
                style={{ backgroundColor: getTeamColorById(selectedOwner.teamId || selectedOwner.team_id) }}
              ></div>
              
              {editMode ? (
                <form onSubmit={handleSaveEdit} className="space-y-5">
                  <div>
                    <label htmlFor="ownerName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nom
                    </label>
                    <Input
                      id="ownerName"
                      type="text"
                      value={editedOwner.name}
                      onChange={(e) => setEditedOwner({ ...editedOwner, name: e.target.value })}
                      placeholder="Nom"
                      required
                      disabled={isSubmitting}
                      className="w-full border-gray-300 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="ownerTeam" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Équipe
                    </label>
                    <select
                      id="ownerTeam"
                      value={editedOwner.teamId}
                      onChange={(e) => setEditedOwner({ ...editedOwner, teamId: e.target.value })}
                      className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white dark:border-gray-500"
                      required
                      disabled={isSubmitting}
                    >
                      <option key="default-edit" value="">Sélectionner une équipe</option>
                      {teams.map(team => {
                        const teamId = team.team_id || team.id;
                        const teamColor = getTeamColorById(teamId);
                        return (
                          <option 
                            key={`edit-${teamId}`} 
                            value={teamId}
                            style={{ 
                              backgroundColor: teamColor,
                              color: getContrastTextColor(teamColor)
                            }}
                          >
                            {team.name}
                          </option>
                        );
                      })}
                    </select>
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
                      disabled={isSubmitting || !editedOwner.name.trim() || !editedOwner.teamId}
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
                    <p className="font-medium text-lg mt-1">{selectedOwner.name}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-600 p-3 rounded-md">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Équipe</p>
                    <div className="flex items-center mt-1">
                      <div 
                        className="w-4 h-4 rounded-full mr-2"
                        style={{ backgroundColor: getTeamColorById(selectedOwner.teamId || selectedOwner.team_id) }}
                      ></div>
                      <p className="font-medium text-lg">{selectedOwner.teamName || getTeamNameById(selectedOwner.teamId || selectedOwner.team_id)}</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-600 p-3 rounded-md">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Couleur de l'équipe</p>
                    <div className="flex items-center mt-2">
                      <div 
                        className="w-6 h-6 rounded mr-3"
                        style={{ backgroundColor: getTeamColorById(selectedOwner.teamId || selectedOwner.team_id) }}
                      ></div>
                      <code className="bg-white dark:bg-gray-700 px-2 py-1 rounded text-sm">
                        {getTeamColorById(selectedOwner.teamId || selectedOwner.team_id)}
                      </code>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Cette couleur est utilisée pour la représentation visuelle de l'équipe dans le calendrier.</p>
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
        message={`Êtes-vous sûr de vouloir supprimer ce membre "${ownerToDelete?.name}" ?`}
      />
    </div>
  );
};