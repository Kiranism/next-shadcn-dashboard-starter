'use client';
import { useState } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  IconCalendar,
  IconSearch,
  IconFilter,
  IconPlus,
  IconEdit,
  IconTrash,
  IconReceipt,
  IconCreditCard,
  IconCoin,
  IconFileInvoice,
  IconDownload,
  IconChartPie,
  IconTrendingUp,
  IconAlertTriangle
} from '@tabler/icons-react';

// Mock data for invoices
const mockInvoices = [
  {
    id: 'INV-2025-001',
    patientName: 'Sophie Martin',
    date: '2025-04-01',
    dueDate: '2025-04-15',
    amount: 120.0,
    status: 'paid',
    paymentMethod: 'Carte bancaire',
    paymentDate: '2025-04-02',
    services: [
      { name: 'Consultation standard', price: 85.0 },
      { name: 'Examens complémentaires', price: 35.0 }
    ]
  },
  {
    id: 'INV-2025-002',
    patientName: 'Thomas Bernard',
    date: '2025-04-01',
    dueDate: '2025-04-15',
    amount: 150.0,
    status: 'paid',
    paymentMethod: 'Virement bancaire',
    paymentDate: '2025-04-03',
    services: [
      { name: 'Consultation spécialiste', price: 120.0 },
      { name: 'Frais de dossier', price: 30.0 }
    ]
  },
  {
    id: 'INV-2025-003',
    patientName: 'Marie Dubois',
    date: '2025-04-02',
    dueDate: '2025-04-16',
    amount: 85.0,
    status: 'pending',
    paymentMethod: null,
    paymentDate: null,
    services: [
      { name: 'Téléconsultation', price: 65.0 },
      { name: 'Frais de prescription', price: 20.0 }
    ]
  },
  {
    id: 'INV-2025-004',
    patientName: 'Jean Dupont',
    date: '2025-04-02',
    dueDate: '2025-04-16',
    amount: 230.0,
    status: 'pending',
    paymentMethod: null,
    paymentDate: null,
    services: [
      { name: 'Consultation longue', price: 150.0 },
      { name: 'Examens complémentaires', price: 80.0 }
    ]
  },
  {
    id: 'INV-2025-005',
    patientName: 'Claire Lefebvre',
    date: '2025-03-25',
    dueDate: '2025-04-08',
    amount: 100.0,
    status: 'overdue',
    paymentMethod: null,
    paymentDate: null,
    services: [
      { name: 'Consultation standard', price: 85.0 },
      { name: 'Frais de dossier', price: 15.0 }
    ]
  },
  {
    id: 'INV-2025-006',
    patientName: 'Philippe Robert',
    date: '2025-03-20',
    dueDate: '2025-04-03',
    amount: 180.0,
    status: 'overdue',
    paymentMethod: null,
    paymentDate: null,
    services: [
      { name: 'Consultation spécialiste', price: 120.0 },
      { name: 'Examens complémentaires', price: 60.0 }
    ]
  },
  {
    id: 'INV-2025-007',
    patientName: 'Émilie Leroy',
    date: '2025-04-03',
    dueDate: '2025-04-17',
    amount: 65.0,
    status: 'paid',
    paymentMethod: 'Carte bancaire',
    paymentDate: '2025-04-03',
    services: [{ name: 'Téléconsultation', price: 65.0 }]
  }
];

// Status badge component
const StatusBadge = ({ status }) => {
  const variants = {
    paid: {
      variant: 'outline',
      className: 'bg-green-100 text-green-800 border-green-300'
    },
    pending: {
      variant: 'outline',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-300'
    },
    overdue: {
      variant: 'outline',
      className: 'bg-red-100 text-red-800 border-red-300'
    }
  };

  const statusText = {
    paid: 'Payée',
    pending: 'En attente',
    overdue: 'En retard'
  };

  const icons = {
    paid: <IconCreditCard size={14} className='mr-1' />,
    pending: <IconClock size={14} className='mr-1' />,
    overdue: <IconAlertTriangle size={14} className='mr-1' />
  };

  return (
    <Badge
      variant={variants[status].variant}
      className={variants[status].className}
    >
      {icons[status]} {statusText[status]}
    </Badge>
  );
};

// Helper icon components
const IconClock = (props) => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      {...props}
    >
      <circle cx='12' cy='12' r='10' />
      <polyline points='12 6 12 12 16 14' />
    </svg>
  );
};

export default function BillingPage() {
  const [invoices, setInvoices] = useState(mockInvoices);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('nan');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceDetails, setShowInvoiceDetails] = useState(false);
  const [newInvoice, setNewInvoice] = useState({
    patientName: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    amount: 0,
    status: 'pending',
    services: [{ name: '', price: 0 }]
  });

  // Filter invoices based on search and status
  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      search === '' ||
      invoice.patientName.toLowerCase().includes(search.toLowerCase()) ||
      invoice.id.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      filterStatus === 'nan' || invoice.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Calculate totals for the dashboard
  const totalRevenue = invoices.reduce(
    (sum, invoice) => sum + invoice.amount,
    0
  );
  const paidAmount = invoices
    .filter((invoice) => invoice.status === 'paid')
    .reduce((sum, invoice) => sum + invoice.amount, 0);
  const pendingAmount = invoices
    .filter((invoice) => invoice.status === 'pending')
    .reduce((sum, invoice) => sum + invoice.amount, 0);
  const overdueAmount = invoices
    .filter((invoice) => invoice.status === 'overdue')
    .reduce((sum, invoice) => sum + invoice.amount, 0);

  // Handle adding services to new invoice
  const addService = () => {
    setNewInvoice({
      ...newInvoice,
      services: [...newInvoice.services, { name: '', price: 0 }]
    });
  };

  // Handle removing services from new invoice
  const removeService = (index) => {
    const updatedServices = [...newInvoice.services];
    updatedServices.splice(index, 1);
    setNewInvoice({
      ...newInvoice,
      services: updatedServices
    });
  };

  // Update service details
  const updateService = (index, field, value) => {
    const updatedServices = [...newInvoice.services];
    updatedServices[index][field] =
      field === 'price' ? parseFloat(value) : value;

    // Calculate total amount
    const totalAmount = updatedServices.reduce(
      (sum, service) => sum + (service.price || 0),
      0
    );

    setNewInvoice({
      ...newInvoice,
      services: updatedServices,
      amount: totalAmount
    });
  };

  // Handle creating a new invoice
  const handleAddInvoice = () => {
    if (
      newInvoice.patientName &&
      newInvoice.date &&
      newInvoice.dueDate &&
      newInvoice.amount > 0
    ) {
      const nextInvoiceNumber = invoices.length + 1;
      setInvoices([
        ...invoices,
        {
          id: `INV-2025-${String(nextInvoiceNumber).padStart(3, '0')}`,
          ...newInvoice,
          paymentMethod: null,
          paymentDate: null
        }
      ]);
      setNewInvoice({
        patientName: '',
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        amount: 0,
        status: 'pending',
        services: [{ name: '', price: 0 }]
      });
      setShowAddDialog(false);
    }
  };

  // Handle marking an invoice as paid
  const handleMarkAsPaid = (id) => {
    setInvoices(
      invoices.map((invoice) => {
        if (invoice.id === id) {
          return {
            ...invoice,
            status: 'paid',
            paymentMethod: 'Carte bancaire', // Default payment method
            paymentDate: new Date().toISOString().split('T')[0]
          };
        }
        return invoice;
      })
    );
  };

  // Handle deleting an invoice
  const handleDeleteInvoice = (id) => {
    setInvoices(invoices.filter((invoice) => invoice.id !== id));
  };

  // Handle opening invoice details
  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setShowInvoiceDetails(true);
  };

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-2xl font-bold tracking-tight'>
            Facturation et Paiements
          </h2>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className='flex items-center gap-1'>
                <IconPlus size={16} />
                Nouvelle Facture
              </Button>
            </DialogTrigger>
            <DialogContent className='sm:max-w-lg'>
              <DialogHeader>
                <DialogTitle>Créer une nouvelle facture</DialogTitle>
                <DialogDescription>
                  Ajoutez les informations nécessaires pour créer une facture.
                </DialogDescription>
              </DialogHeader>
              <div className='grid gap-4 py-4'>
                <div className='grid gap-2'>
                  <label htmlFor='patient'>Patient</label>
                  <Input
                    id='patient'
                    value={newInvoice.patientName}
                    onChange={(e) =>
                      setNewInvoice({
                        ...newInvoice,
                        patientName: e.target.value
                      })
                    }
                    placeholder='Nom du patient'
                  />
                </div>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='grid gap-2'>
                    <label htmlFor='date'>Date d'émission</label>
                    <Input
                      id='date'
                      type='date'
                      value={newInvoice.date}
                      onChange={(e) =>
                        setNewInvoice({ ...newInvoice, date: e.target.value })
                      }
                    />
                  </div>
                  <div className='grid gap-2'>
                    <label htmlFor='dueDate'>Date d'échéance</label>
                    <Input
                      id='dueDate'
                      type='date'
                      value={newInvoice.dueDate}
                      onChange={(e) =>
                        setNewInvoice({
                          ...newInvoice,
                          dueDate: e.target.value
                        })
                      }
                    />
                  </div>
                </div>

                <div className='grid gap-2'>
                  <div className='flex items-center justify-between'>
                    <label>Services</label>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={addService}
                      className='flex items-center gap-1'
                    >
                      <IconPlus size={14} /> Ajouter un service
                    </Button>
                  </div>

                  {newInvoice.services.map((service, index) => (
                    <div key={index} className='flex items-end gap-2'>
                      <div className='flex-1'>
                        <Input
                          placeholder='Nom du service'
                          value={service.name}
                          onChange={(e) =>
                            updateService(index, 'name', e.target.value)
                          }
                        />
                      </div>
                      <div className='w-32'>
                        <Input
                          type='number'
                          placeholder='Prix'
                          value={service.price || ''}
                          onChange={(e) =>
                            updateService(index, 'price', e.target.value)
                          }
                        />
                      </div>
                      {index > 0 && (
                        <Button
                          type='button'
                          variant='ghost'
                          size='icon'
                          onClick={() => removeService(index)}
                        >
                          <IconTrash size={16} />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <div className='flex justify-end'>
                  <div className='text-right'>
                    <div className='text-muted-foreground text-sm'>Total</div>
                    <div className='text-xl font-bold'>
                      {newInvoice.amount.toFixed(2)} €
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant='outline'
                  onClick={() => setShowAddDialog(false)}
                >
                  Annuler
                </Button>
                <Button onClick={handleAddInvoice}>Créer la facture</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>Chiffre d'affaires total</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                {totalRevenue.toFixed(2)} €
              </CardTitle>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='flex gap-2 font-medium'>
                <IconCoin className='size-4' /> Pour le mois en cours
              </div>
            </CardFooter>
          </Card>
          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>Paiements reçus</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                {paidAmount.toFixed(2)} €
              </CardTitle>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='flex gap-2 font-medium'>
                <IconTrendingUp className='size-4' />{' '}
                {Math.round((paidAmount / totalRevenue) * 100)}% du total
              </div>
            </CardFooter>
          </Card>
          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>Paiements en attente</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                {pendingAmount.toFixed(2)} €
              </CardTitle>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='flex gap-2 font-medium'>
                <IconClock className='size-4' />{' '}
                {Math.round((pendingAmount / totalRevenue) * 100)}% du total
              </div>
            </CardFooter>
          </Card>
          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>Paiements en retard</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                {overdueAmount.toFixed(2)} €
              </CardTitle>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='flex gap-2 font-medium text-red-600'>
                <IconAlertTriangle className='size-4' />{' '}
                {Math.round((overdueAmount / totalRevenue) * 100)}% du total
              </div>
            </CardFooter>
          </Card>
        </div>

        {/* Filters and search */}
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex items-center gap-2'>
            <div className='relative'>
              <IconSearch className='text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4' />
              <Input
                type='search'
                placeholder='Rechercher...'
                className='w-full pl-8 sm:w-64'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className='flex items-center gap-2'>
              <IconFilter className='text-muted-foreground h-4 w-4' />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className='w-full sm:w-40'>
                  <SelectValue placeholder='Tous les statuts' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='nan'>Tous les statuts</SelectItem>
                  <SelectItem value='paid'>Payées</SelectItem>
                  <SelectItem value='pending'>En attente</SelectItem>
                  <SelectItem value='overdue'>En retard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        <Card>
          <CardContent className='p-0'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Facture</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Échéance</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className='text-muted-foreground py-6 text-center'
                    >
                      Aucune facture trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className='font-medium'>
                        {invoice.id}
                      </TableCell>
                      <TableCell>{invoice.patientName}</TableCell>
                      <TableCell>
                        {new Date(invoice.date).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        {new Date(invoice.dueDate).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell className='font-medium'>
                        {invoice.amount.toFixed(2)} €
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={invoice.status} />
                      </TableCell>
                      <TableCell className='text-right'>
                        <div className='flex justify-end gap-2'>
                          <Button
                            variant='ghost'
                            size='icon'
                            onClick={() => handleViewInvoice(invoice)}
                          >
                            <IconFileInvoice size={16} />
                          </Button>
                          {invoice.status !== 'paid' && (
                            <Button
                              variant='ghost'
                              size='icon'
                              onClick={() => handleMarkAsPaid(invoice.id)}
                            >
                              <IconCreditCard size={16} />
                            </Button>
                          )}
                          <Button
                            variant='ghost'
                            size='icon'
                            onClick={() => handleDeleteInvoice(invoice.id)}
                          >
                            <IconTrash size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className='flex justify-between py-4'>
            <div className='text-muted-foreground text-sm'>
              Affichage de {filteredInvoices.length} sur {invoices.length}{' '}
              factures
            </div>
            <div className='flex gap-2'>
              <Button variant='outline' size='sm' disabled>
                Précédent
              </Button>
              <Button variant='outline' size='sm' disabled>
                Suivant
              </Button>
            </div>
          </CardFooter>
        </Card>

        {/* Payment Method Distribution */}
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>
                Répartition des paiements
              </CardTitle>
              <CardDescription>Par méthode de paiement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <div className='h-4 w-4 rounded-full bg-blue-500'></div>
                    <span>Carte bancaire</span>
                  </div>
                  <span className='font-medium'>65%</span>
                </div>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <div className='h-4 w-4 rounded-full bg-green-500'></div>
                    <span>Virement bancaire</span>
                  </div>
                  <span className='font-medium'>25%</span>
                </div>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <div className='h-4 w-4 rounded-full bg-yellow-500'></div>
                    <span>Espèces</span>
                  </div>
                  <span className='font-medium'>10%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Payments */}
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Paiements récents</CardTitle>
              <CardDescription>Dernières transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {invoices
                  .filter((invoice) => invoice.status === 'paid')
                  .sort(
                    (a, b) => new Date(b.paymentDate) - new Date(a.paymentDate)
                  )
                  .slice(0, 3)
                  .map((invoice) => (
                    <div
                      key={`payment-${invoice.id}`}
                      className='flex items-center justify-between'
                    >
                      <div className='flex items-center gap-3'>
                        <div className='bg-primary/10 flex h-9 w-9 items-center justify-center rounded-full'>
                          <IconReceipt className='text-primary h-5 w-5' />
                        </div>
                        <div>
                          <div className='font-medium'>
                            {invoice.patientName}
                          </div>
                          <div className='text-muted-foreground text-sm'>
                            {invoice.paymentMethod}
                          </div>
                        </div>
                      </div>
                      <div className='text-right'>
                        <div className='font-medium'>
                          {invoice.amount.toFixed(2)} €
                        </div>
                        <div className='text-muted-foreground text-sm'>
                          {new Date(invoice.paymentDate).toLocaleDateString(
                            'fr-FR'
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Invoice Details Dialog */}
      <Dialog open={showInvoiceDetails} onOpenChange={setShowInvoiceDetails}>
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>Détails de la facture</DialogTitle>
            <DialogDescription>{selectedInvoice?.id}</DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className='space-y-6'>
              <div className='flex justify-between'>
                <div>
                  <h3 className='font-bold'>Cabinet Médical</h3>
                  <p className='text-muted-foreground text-sm'>
                    123 Avenue de la Santé
                  </p>
                  <p className='text-muted-foreground text-sm'>75000 Paris</p>
                </div>
                <div className='text-right'>
                  <h3 className='font-semibold'>Patient</h3>
                  <p className='text-sm'>{selectedInvoice.patientName}</p>
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4 text-sm'>
                <div>
                  <p className='text-muted-foreground'>Date d'émission</p>
                  <p>
                    {new Date(selectedInvoice.date).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div>
                  <p className='text-muted-foreground'>Date d'échéance</p>
                  <p>
                    {new Date(selectedInvoice.dueDate).toLocaleDateString(
                      'fr-FR'
                    )}
                  </p>
                </div>
                {selectedInvoice.status === 'paid' && (
                  <>
                    <div>
                      <p className='text-muted-foreground'>Date de paiement</p>
                      <p>
                        {new Date(
                          selectedInvoice.paymentDate
                        ).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div>
                      <p className='text-muted-foreground'>
                        Méthode de paiement
                      </p>
                      <p>{selectedInvoice.paymentMethod}</p>
                    </div>
                  </>
                )}
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead className='text-right'>Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedInvoice.services.map((service, index) => (
                    <TableRow key={index}>
                      <TableCell>{service.name}</TableCell>
                      <TableCell className='text-right'>
                        {service.price.toFixed(2)} €
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className='border-border flex justify-between border-t pt-4'>
                <div className='font-semibold'>Total</div>
                <div className='font-bold'>
                  {selectedInvoice.amount.toFixed(2)} €
                </div>
              </div>

              <div className='flex justify-end gap-2'>
                <Button variant='outline'>
                  <IconDownload size={16} className='mr-2' />
                  Télécharger PDF
                </Button>
                {selectedInvoice.status !== 'paid' && (
                  <Button
                    onClick={() => {
                      handleMarkAsPaid(selectedInvoice.id);
                      setShowInvoiceDetails(false);
                    }}
                  >
                    <IconCreditCard size={16} className='mr-2' />
                    Marquer comme payée
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
