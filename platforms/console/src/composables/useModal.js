import { ref } from 'vue';

export function useModal() {
  const modal = ref({
    isOpen: false,
    title: '',
    message: '',
    type: 'alert',
    variant: 'primary',
    confirmText: 'OK',
    onConfirm: () => {}
  });

  const confirm = (title, message, onConfirm, variant = 'primary', confirmText = 'OK') => {
    modal.value = {
      isOpen: true,
      title,
      message,
      type: 'confirm',
      variant,
      confirmText,
      onConfirm: () => {
        modal.value.isOpen = false;
        onConfirm();
      }
    };
  };

  const alert = (title, message, variant = 'primary') => {
    modal.value = {
      isOpen: true,
      title,
      message,
      type: 'alert',
      variant,
      confirmText: 'OK',
      onConfirm: () => {
        modal.value.isOpen = false;
      }
    };
  };

  return {
    modal,
    confirm,
    alert
  };
}
