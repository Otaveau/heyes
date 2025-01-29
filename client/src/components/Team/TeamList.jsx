import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

const TeamList = ({ teams, onDelete }) => {
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {teams.map(team => (
        <Card key={team.id} className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold">{team.name}</h3>
              <p className="text-sm text-gray-600">
                {team.members ? `${team.members.length} membres` : '0 membre'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(team.id)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
};

export { TeamList };