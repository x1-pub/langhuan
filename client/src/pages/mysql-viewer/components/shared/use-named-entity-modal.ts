import { useState } from 'react';

interface NamedEntity {
  name: string;
}

export const useNamedEntityModal = <TEntity extends NamedEntity>() => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<TEntity | null>(null);

  const openCreateModal = () => {
    setEditingEntity(null);
    setModalOpen(true);
  };

  const openEditModal = (entity: TEntity) => {
    setEditingEntity(entity);
    setModalOpen(true);
  };

  const closeModal = () => {
    setEditingEntity(null);
    setModalOpen(false);
  };

  const closeIfEditingTarget = (name: string) => {
    if (editingEntity?.name !== name) {
      return;
    }

    closeModal();
  };

  return {
    modalOpen,
    editingEntity,
    openCreateModal,
    openEditModal,
    closeModal,
    closeIfEditingTarget,
  };
};

export default useNamedEntityModal;
