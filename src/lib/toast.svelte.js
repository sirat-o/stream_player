export const toastStack = $state([]);

export function showToast(message) {
  const id = Math.random().toString(36).slice(2);
  toastStack.push({ id, message });
  setTimeout(() => {
    const index = toastStack.findIndex(t => t.id === id);
    if (index !== -1) toastStack.splice(index, 1);
  }, 4000);
}
