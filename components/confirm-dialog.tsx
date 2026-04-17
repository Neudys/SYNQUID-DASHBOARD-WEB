'use client'

import { useEffect, useState } from 'react'
import { AlertTriangleIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  acknowledgement?: string
  variant?: 'destructive' | 'default'
  loading?: boolean
  onConfirm: () => void | Promise<void>
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  acknowledgement = 'I acknowledge I understand what I am doing and the consequences of this action.',
  variant = 'destructive',
  loading = false,
  onConfirm,
}: ConfirmDialogProps) {
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (!open) setChecked(false)
  }, [open])

  const isDestructive = variant === 'destructive'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={
                isDestructive
                  ? 'flex size-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive'
                  : 'flex size-9 shrink-0 items-center justify-center rounded-lg bg-teal/15 text-teal'
              }
            >
              <AlertTriangleIcon className="size-4" />
            </div>
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription className="pt-2">{description}</DialogDescription>
        </DialogHeader>

        <label
          htmlFor="confirm-acknowledge"
          className="flex cursor-pointer items-start gap-2.5 rounded-md border border-border/60 bg-secondary/30 p-3 text-sm hover:bg-secondary/50 transition-colors"
        >
          <Checkbox
            id="confirm-acknowledge"
            checked={checked}
            onCheckedChange={(v) => setChecked(v === true)}
            className="mt-0.5"
          />
          <Label htmlFor="confirm-acknowledge" className="cursor-pointer leading-snug font-normal">
            {acknowledgement}
          </Label>
        </label>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" className="cursor-pointer" />}>
            {cancelLabel}
          </DialogClose>
          <Button
            className={
              isDestructive
                ? 'cursor-pointer bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-[0.98] transition-transform duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-50'
                : 'cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-transform duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-50'
            }
            onClick={async () => {
              await onConfirm()
            }}
            disabled={!checked || loading}
          >
            {loading ? 'Working…' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
