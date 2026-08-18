import { createFileRoute } from '@tanstack/react-router';
import { Page } from '@/components/common';
import { useState } from 'react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from '@/components/ui/drawer';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from '@/components/ui/resizable';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Toggle } from '@/components/ui/toggle';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

export const Route = createFileRoute('/')({ component: Showcase });

function Showcase() {
    const [progress, setProgress] = useState(64);
    const [open, setOpen] = useState(false);

    return (
        <TooltipProvider>
            <Page className="space-y-8">
                <header className="space-y-3">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="#">Arcus</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>
                                    Component showcase
                                </BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <Badge variant="secondary">shadcn/ui</Badge>
                            <h1 className="mt-2 text-4xl font-bold tracking-tight">
                                Component showcase
                            </h1>
                            <p className="text-muted-foreground">
                                Every installed component, using your tweakcn
                                theme.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={() =>
                                    toast.success('Your theme is working!')
                                }
                            >
                                Show toast
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() =>
                                    setProgress((value) =>
                                        value >= 100 ? 0 : value + 10,
                                    )
                                }
                            >
                                Update progress
                            </Button>
                        </div>
                    </div>
                </header>

                <Card>
                    <CardHeader>
                        <CardTitle>Basics</CardTitle>
                        <CardDescription>
                            Typography, actions, form controls, and feedback.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                                <Button>Primary</Button>
                                <Button variant="secondary">Secondary</Button>
                                <Button variant="outline">Outline</Button>
                                <Button variant="destructive">
                                    Destructive
                                </Button>
                                <Button variant="ghost">Ghost</Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Badge>Default</Badge>
                                <Badge variant="secondary">Secondary</Badge>
                                <Badge variant="outline">Outline</Badge>
                                <Badge variant="destructive">Destructive</Badge>
                            </div>
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src="https://i.pravatar.cc/80?img=12" />
                                    <AvatarFallback>AB</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium">Alex Brown</p>
                                    <p className="text-sm text-muted-foreground">
                                        Designer
                                    </p>
                                </div>
                            </div>
                            <Separator />
                            <Progress value={progress} />
                            <Skeleton className="h-4 w-3/4" />
                        </div>
                        <div className="space-y-4">
                            <Field>
                                <FieldLabel htmlFor="email">Email</FieldLabel>
                                <Input
                                    id="email"
                                    placeholder="you@example.com"
                                />
                                <FieldDescription>
                                    We will never share your email.
                                </FieldDescription>
                            </Field>
                            <div className="grid gap-2">
                                <Label htmlFor="select">Team</Label>
                                <Select>
                                    <SelectTrigger id="select">
                                        <SelectValue placeholder="Choose a team" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="design">
                                            Design
                                        </SelectItem>
                                        <SelectItem value="engineering">
                                            Engineering
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-2">
                                <Checkbox id="terms" />
                                <Label htmlFor="terms">
                                    Accept terms and conditions
                                </Label>
                            </div>
                            <Textarea placeholder="Leave a note..." />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Navigation and overlays</CardTitle>
                        <CardDescription>
                            Menus, dialogs, drawers, sheets, and popovers.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-3">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline">Dropdown menu</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem>Profile</DropdownMenuItem>
                                <DropdownMenuItem>Settings</DropdownMenuItem>
                                <DropdownMenuItem>Sign out</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline">Open dialog</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Example dialog</DialogTitle>
                                    <DialogDescription>
                                        This dialog inherits your theme
                                        variables.
                                    </DialogDescription>
                                </DialogHeader>
                                <Button onClick={() => toast('Dialog action')}>
                                    Continue
                                </Button>
                            </DialogContent>
                        </Dialog>
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="outline">Open sheet</Button>
                            </SheetTrigger>
                            <SheetContent>
                                <SheetHeader>
                                    <SheetTitle>Settings</SheetTitle>
                                    <SheetDescription>
                                        Configure your preferences.
                                    </SheetDescription>
                                </SheetHeader>
                            </SheetContent>
                        </Sheet>
                        <Drawer>
                            <DrawerTrigger asChild>
                                <Button variant="outline">Open drawer</Button>
                            </DrawerTrigger>
                            <DrawerContent>
                                <DrawerHeader>
                                    <DrawerTitle>Mobile drawer</DrawerTitle>
                                    <DrawerDescription>
                                        Responsive overlay content.
                                    </DrawerDescription>
                                </DrawerHeader>
                            </DrawerContent>
                        </Drawer>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline">Popover</Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64">
                                A small floating panel.
                            </PopoverContent>
                        </Popover>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline">Hover me</Button>
                            </TooltipTrigger>
                            <TooltipContent>Tooltip content</TooltipContent>
                        </Tooltip>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Interactive controls</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="flex flex-wrap items-center gap-3">
                            <Toggle>Bold</Toggle>
                            <ToggleGroup type="single" defaultValue="center">
                                <ToggleGroupItem value="left">
                                    Left
                                </ToggleGroupItem>
                                <ToggleGroupItem value="center">
                                    Center
                                </ToggleGroupItem>
                                <ToggleGroupItem value="right">
                                    Right
                                </ToggleGroupItem>
                            </ToggleGroup>
                            <Collapsible open={open} onOpenChange={setOpen}>
                                <CollapsibleTrigger asChild>
                                    <Button variant="outline">
                                        {open ? 'Hide' : 'Show'} details
                                    </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="p-3 text-sm text-muted-foreground">
                                    Collapsible content is visible.
                                </CollapsibleContent>
                            </Collapsible>
                        </div>
                        <ContextMenu>
                            <ContextMenuTrigger className="flex h-20 items-center justify-center rounded-md border border-dashed text-sm">
                                Right-click this area
                            </ContextMenuTrigger>
                            <ContextMenuContent>
                                <ContextMenuItem>Copy</ContextMenuItem>
                                <ContextMenuItem>Rename</ContextMenuItem>
                            </ContextMenuContent>
                        </ContextMenu>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Table and layout</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">
                                        Amount
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {[
                                    ['Starter plan', 'Active', '$24'],
                                    ['Pro plan', 'Pending', '$99'],
                                    ['Enterprise', 'Active', '$240'],
                                ].map(([name, status, amount]) => (
                                    <TableRow key={name}>
                                        <TableCell className="font-medium">
                                            {name}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    status === 'Active'
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                            >
                                                {status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {amount}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <Tabs defaultValue="account">
                            <TabsList>
                                <TabsTrigger value="account">
                                    Account
                                </TabsTrigger>
                                <TabsTrigger value="security">
                                    Security
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent
                                value="account"
                                className="text-sm text-muted-foreground"
                            >
                                Account preferences.
                            </TabsContent>
                            <TabsContent
                                value="security"
                                className="text-sm text-muted-foreground"
                            >
                                Security preferences.
                            </TabsContent>
                        </Tabs>
                        <ResizablePanelGroup
                            direction="horizontal"
                            className="min-h-24 rounded-lg border"
                        >
                            <ResizablePanel
                                defaultSize={50}
                                className="p-4 text-sm"
                            >
                                Resizable panel one
                            </ResizablePanel>
                            <ResizableHandle withHandle />
                            <ResizablePanel
                                defaultSize={50}
                                className="p-4 text-sm"
                            >
                                Resizable panel two
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    </CardContent>
                </Card>
            </Page>
        </TooltipProvider>
    );
}
