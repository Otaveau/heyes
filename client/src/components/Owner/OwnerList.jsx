import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Edit } from 'lucide-react';

const OwnerList = ({ owners, onDelete, onEdit }) => {
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {owners.map(owner => (
        <Card key={owner.id} className="p-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">{owner.name}</h3>
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(owner)}
                  className="text-blue-500 hover:text-blue-700"
                >
                  <Edit className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(owner.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <p className="text-sm text-gray-600">{owner.email}</p>
            <p className="text-sm text-gray-600">Équipe: {owner.teamName}</p>
          </div>
        </Card>
      ))}
    </div>
  );
};

export { OwnerList };