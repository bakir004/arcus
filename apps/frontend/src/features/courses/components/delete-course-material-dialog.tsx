import { Loader2 } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function DeleteCourseMaterialDialog({
    name,
    open,
    onOpenChange,
    onConfirm,
    pending,
}: {
    name: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    pending: boolean;
}) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete course material?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete “{name}”. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction variant="destructive" disabled={pending} onClick={onConfirm}>
                        {pending && <Loader2 className="size-4 animate-spin" />} Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

