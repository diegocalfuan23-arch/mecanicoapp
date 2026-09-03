"use client";

import { Toast } from "@base-ui/react/toast";

/** Manager global: se puede llamar toaster.add(...) desde cualquier
 * componente cliente, sin necesitar useToastManager() ni estar
 * dentro del Provider. */
export const toaster = Toast.createToastManager();

function Toasts() {
  const { toasts } = Toast.useToastManager();

  return (
    <Toast.Portal>
      <Toast.Viewport className="fixed inset-x-0 bottom-0 z-50 flex flex-col gap-2 p-4 sm:inset-x-auto sm:right-4">
        {toasts.map((toast) => (
          <Toast.Root
            key={toast.id}
            toast={toast}
            className="w-full rounded-lg border border-border bg-card px-4 py-3 shadow-lg sm:w-80"
          >
            {toast.title && (
              <Toast.Title className="text-[14px] font-medium" />
            )}
            {toast.description && (
              <Toast.Description className="mt-1 text-[13px] text-muted-foreground" />
            )}
          </Toast.Root>
        ))}
      </Toast.Viewport>
    </Toast.Portal>
  );
}

export function Toaster() {
  return (
    <Toast.Provider toastManager={toaster}>
      <Toasts />
    </Toast.Provider>
  );
}
