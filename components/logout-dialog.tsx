'use client'

import { useState } from 'react'
import { Loader2Icon, LogOutIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'

interface LogoutDialogProps {
  children: React.ReactNode
}

export function LogoutDialog({ children }: LogoutDialogProps) {
  const { logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    setLoading(true)
    try {
      await logout()
    } finally {
      setLoading(false)
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children as React.ReactElement} />
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <LogOutIcon className="size-5" strokeWidth={2.25} />
          </div>
          <DialogTitle>¿Cerrar sesión?</DialogTitle>
          <DialogDescription>
            Se cerrará tu sesión actual y tendrás que volver a iniciar sesión para acceder al panel.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
            className="cursor-pointer"
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading}
            className="cursor-pointer gap-2 active:scale-[0.98] transition-transform duration-150 ease-out"
          >
            {loading ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Cerrando…
              </>
            ) : (
              'Cerrar sesión'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
