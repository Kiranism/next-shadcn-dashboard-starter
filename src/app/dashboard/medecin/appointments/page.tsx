'use client';
import { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
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
  IconClock,
  IconUser,
  IconPlus,
  IconEdit,
  IconTrash,
  IconCheck,
  IconX,
  IconCalendarEvent,
  IconChevronLeft,
  IconChevronRight
} from '@tabler/icons-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

// Mock data for doctors
const doctors = [
  { id: 1, name: 'Dr. Laurent' },
  { id: 2, name: 'Dr. Moreau' },
  { id: 3, name: 'Dr. Petit' }
];

// Mock data for appointments
const mockAppointments = [
  {
    id: 1,
    patientName: 'Sophie Martin',
    date: '2025-04-07',
    time: '09:00',
    endTime: '09:30',
    service: 'Consultation',
    status: 'confirmed',
    doctor: 'Dr. Laurent',
    notes: 'Suivi traitement hypertension'
  },
  {
    id: 2,
    patientName: 'Thomas Bernard',
    date: '2025-04-07',
    time: '10:30',
    endTime: '11:00',
    service: 'Check-up',
    status: 'pending',
    doctor: 'Dr. Laurent',
    notes: 'Bilan annuel'
  },
  {
    id: 3,
    patientName: 'Marie Dubois',
    date: '2025-04-07',
    time: '14:00',
    endTime: '14:30',
    service: 'Téléconsultation',
    status: 'confirmed',
    doctor: 'Dr. Laurent',
    notes: 'Consultation de suivi post-opératoire'
  },
  {
    id: 4,
    patientName: 'Jean Dupont',
    date: '2025-04-08',
    time: '11:15',
    endTime: '11:45',
    service: 'Examen',
    status: 'confirmed',
    doctor: 'Dr. Laurent',
    notes: 'Examens cardiaques'
  },
  {
    id: 5,
    patientName: 'Claire Lefebvre',
    date: '2025-04-09',
    time: '15:45',
    endTime: '16:15',
    service: 'Consultation',
    status: 'confirmed',
    doctor: 'Dr. Laurent',
    notes: 'Première consultation'
  },
  {
    id: 6,
    patientName: 'Philippe Robert',
    date: '2025-04-10',
    time: '08:30',
    endTime: '09:00',
    service: 'Check-up',
    status: 'confirmed',
    doctor: 'Dr. Laurent',
    notes: 'Suivi diabète'
  },
  {
    id: 7,
    patientName: 'Émilie Leroy',
    date: '2025-04-11',
    time: '13:00',
    endTime: '13:30',
    service: 'Téléconsultation',
    status: 'pending',
    doctor: 'Dr. Laurent',
    notes: 'Résultats examens'
  }
];

// Mock data for doctor availability
const mockAvailability = [
  {
    id: 1,
    doctorId: 1,
    day: 'Lundi',
    isAvailable: true,
    slots: [
      { startTime: '08:00', endTime: '12:00' },
      { startTime: '14:00', endTime: '18:00' }
    ]
  },
  {
    id: 2,
    doctorId: 1,
    day: 'Mardi',
    isAvailable: true,
    slots: [
      { startTime: '08:00', endTime: '12:00' },
      { startTime: '14:00', endTime: '18:00' }
    ]
  },
  {
    id: 3,
    doctorId: 1,
    day: 'Mercredi',
    isAvailable: true,
    slots: [
      { startTime: '08:00', endTime: '12:00' },
      { startTime: '14:00', endTime: '18:00' }
    ]
  },
  {
    id: 4,
    doctorId: 1,
    day: 'Jeudi',
    isAvailable: true,
    slots: [
      { startTime: '08:00', endTime: '12:00' },
      { startTime: '14:00', endTime: '18:00' }
    ]
  },
  {
    id: 5,
    doctorId: 1,
    day: 'Vendredi',
    isAvailable: true,
    slots: [
      { startTime: '08:00', endTime: '12:00' },
      { startTime: '14:00', endTime: '16:00' }
    ]
  },
  {
    id: 6,
    doctorId: 1,
    day: 'Samedi',
    isAvailable: false,
    slots: []
  },
  {
    id: 7,
    doctorId: 1,
    day: 'Dimanche',
    isAvailable: false,
    slots: []
  }
];

// Status badge component
const StatusBadge = ({ status }) => {
  const variants = {
    confirmed: {
      variant: 'outline',
      className: 'bg-green-100 text-green-800 border-green-300'
    },
    pending: {
      variant: 'outline',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-300'
    },
    cancelled: {
      variant: 'outline',
      className: 'bg-red-100 text-red-800 border-red-300'
    }
  };

  const statusText = {
    confirmed: 'Confirmé',
    pending: 'En attente',
    cancelled: 'Annulé'
  };

  return (
    <Badge
      variant={variants[status].variant}
      className={variants[status].className}
    >
      {statusText[status]}
    </Badge>
  );
};

// Helper function to get the week dates
const getWeekDates = (date) => {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(date);
  monday.setDate(diff);

  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(monday);
    currentDate.setDate(monday.getDate() + i);
    weekDates.push(currentDate);
  }

  return weekDates;
};

// Helper function to format date for comparison
const formatDateForComparison = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Helper function to get time slots for the calendar
const getTimeSlots = () => {
  const slots = [];
  for (let hour = 8; hour < 19; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      slots.push(
        `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
      );
    }
  }
  return slots;
};

export default function DoctorSchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekDates, setWeekDates] = useState(getWeekDates(currentDate));
  const [appointments, setAppointments] = useState(mockAppointments);
  const [availability, setAvailability] = useState(mockAvailability);
  const [selectedDoctor, setSelectedDoctor] = useState(doctors[0].name);
  const [showAppointmentDialog, setShowAppointmentDialog] = useState(false);
  const [showAvailabilityDialog, setShowAvailabilityDialog] = useState(false);
  const [appointmentDetails, setAppointmentDetails] = useState(null);
  const [newAppointment, setNewAppointment] = useState({
    patientName: '',
    date: '',
    time: '',
    endTime: '',
    service: '',
    doctor: selectedDoctor,
    status: 'pending',
    notes: ''
  });
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedDayAvailability, setSelectedDayAvailability] = useState(null);

  // Time slots for the calendar
  const timeSlots = getTimeSlots();

  // Update week dates when current date changes
  useEffect(() => {
    setWeekDates(getWeekDates(currentDate));
  }, [currentDate]);

  // Filter appointments for the selected doctor
  const doctorAppointments = appointments.filter(
    (appointment) => appointment.doctor === selectedDoctor
  );

  // Handle navigating to previous week
  const handlePreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  // Handle navigating to next week
  const handleNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  // Handle navigating to current week
  const handleCurrentWeek = () => {
    setCurrentDate(new Date());
  };

  // Handle adding a new appointment
  const handleAddAppointment = () => {
    if (
      newAppointment.patientName &&
      newAppointment.date &&
      newAppointment.time &&
      newAppointment.endTime &&
      newAppointment.service
    ) {
      setAppointments([
        ...appointments,
        {
          id: appointments.length + 1,
          ...newAppointment,
          doctor: selectedDoctor
        }
      ]);
      setNewAppointment({
        patientName: '',
        date: '',
        time: '',
        endTime: '',
        service: '',
        doctor: selectedDoctor,
        status: 'pending',
        notes: ''
      });
      setShowAppointmentDialog(false);
    }
  };

  // Handle updating appointment details
  const handleUpdateAppointment = () => {
    if (appointmentDetails) {
      setAppointments(
        appointments.map((appointment) =>
          appointment.id === appointmentDetails.id
            ? appointmentDetails
            : appointment
        )
      );
      setAppointmentDetails(null);
      setShowAppointmentDialog(false);
    }
  };

  // Handle deleting an appointment
  const handleDeleteAppointment = (id) => {
    setAppointments(
      appointments.filter((appointment) => appointment.id !== id)
    );
  };

  // Handle opening appointment dialog for editing
  const handleEditAppointment = (appointment) => {
    setAppointmentDetails(appointment);
    setShowAppointmentDialog(true);
  };

  // Handle opening availability dialog
  const handleEditAvailability = (day) => {
    const dayName = day.toLocaleDateString('fr-FR', { weekday: 'long' });
    const dayCapitalized = dayName.charAt(0).toUpperCase() + dayName.slice(1);

    const dayAvailability = availability.find(
      (avail) => avail.day === dayCapitalized
    );

    setSelectedDay(dayCapitalized);
    setSelectedDayAvailability(dayAvailability);
    setShowAvailabilityDialog(true);
  };

  // Handle updating availability
  const handleUpdateAvailability = () => {
    if (selectedDayAvailability) {
      setAvailability(
        availability.map((avail) =>
          avail.day === selectedDay ? selectedDayAvailability : avail
        )
      );
      setSelectedDay(null);
      setSelectedDayAvailability(null);
      setShowAvailabilityDialog(false);
    }
  };

  // Handle adding a new time slot to availability
  const handleAddTimeSlot = () => {
    if (selectedDayAvailability) {
      setSelectedDayAvailability({
        ...selectedDayAvailability,
        slots: [
          ...selectedDayAvailability.slots,
          { startTime: '08:00', endTime: '12:00' }
        ]
      });
    }
  };

  // Handle removing a time slot from availability
  const handleRemoveTimeSlot = (index) => {
    if (selectedDayAvailability) {
      const newSlots = [...selectedDayAvailability.slots];
      newSlots.splice(index, 1);
      setSelectedDayAvailability({
        ...selectedDayAvailability,
        slots: newSlots
      });
    }
  };

  // Handle updating a time slot in availability
  const handleUpdateTimeSlot = (index, field, value) => {
    if (selectedDayAvailability) {
      const newSlots = [...selectedDayAvailability.slots];
      newSlots[index] = { ...newSlots[index], [field]: value };
      setSelectedDayAvailability({
        ...selectedDayAvailability,
        slots: newSlots
      });
    }
  };

  // Check if a time slot has an appointment
  const getAppointmentForSlot = (date, time) => {
    const formattedDate = formatDateForComparison(date);
    return doctorAppointments.find(
      (appointment) =>
        appointment.date === formattedDate && appointment.time === time
    );
  };

  // Check if a time slot is within doctor's availability
  const isTimeSlotAvailable = (date, time) => {
    const dayName = date.toLocaleDateString('fr-FR', { weekday: 'long' });
    const dayCapitalized = dayName.charAt(0).toUpperCase() + dayName.slice(1);

    const dayAvailability = availability.find(
      (avail) => avail.day === dayCapitalized
    );

    if (!dayAvailability || !dayAvailability.isAvailable) {
      return false;
    }

    return dayAvailability.slots.some(
      (slot) => time >= slot.startTime && time < slot.endTime
    );
  };

  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short'
    });
  };

  // Count upcoming appointments
  const todayFormatted = formatDateForComparison(new Date());
  const upcomingAppointments = doctorAppointments.filter(
    (a) => a.date >= todayFormatted && a.status !== 'cancelled'
  ).length;

  // Count appointments by status
  const confirmedCount = doctorAppointments.filter(
    (a) => a.status === 'confirmed'
  ).length;
  const pendingCount = doctorAppointments.filter(
    (a) => a.status === 'pending'
  ).length;
  const cancelledCount = doctorAppointments.filter(
    (a) => a.status === 'cancelled'
  ).length;

  const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-2xl font-bold tracking-tight'>
            Planning Médical
          </h2>
          <div className='flex gap-2'>
            <Select
              value={selectedDoctor}
              onValueChange={(value) => setSelectedDoctor(value)}
            >
              <SelectTrigger className='w-[180px]'>
                <SelectValue placeholder='Sélectionner médecin' />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((doctor) => (
                  <SelectItem key={doctor.id} value={doctor.name}>
                    {doctor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog
              open={showAppointmentDialog}
              onOpenChange={setShowAppointmentDialog}
            >
              <DialogTrigger asChild>
                <Button className='flex items-center gap-1'>
                  <IconPlus size={16} />
                  Nouveau RDV
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {appointmentDetails
                      ? 'Modifier le rendez-vous'
                      : 'Ajouter un rendez-vous'}
                  </DialogTitle>
                  <DialogDescription>
                    {appointmentDetails
                      ? 'Modifiez les informations du rendez-vous.'
                      : 'Remplissez les informations pour créer un nouveau rendez-vous.'}
                  </DialogDescription>
                </DialogHeader>
                <div className='grid gap-4 py-4'>
                  <div className='grid gap-2'>
                    <label htmlFor='patient'>Patient</label>
                    <Input
                      id='patient'
                      value={
                        appointmentDetails
                          ? appointmentDetails.patientName
                          : newAppointment.patientName
                      }
                      onChange={(e) =>
                        appointmentDetails
                          ? setAppointmentDetails({
                              ...appointmentDetails,
                              patientName: e.target.value
                            })
                          : setNewAppointment({
                              ...newAppointment,
                              patientName: e.target.value
                            })
                      }
                      placeholder='Nom du patient'
                    />
                  </div>
                  <div className='grid grid-cols-2 gap-4'>
                    <div className='grid gap-2'>
                      <label htmlFor='date'>Date</label>
                      <Input
                        id='date'
                        type='date'
                        value={
                          appointmentDetails
                            ? appointmentDetails.date
                            : newAppointment.date
                        }
                        onChange={(e) =>
                          appointmentDetails
                            ? setAppointmentDetails({
                                ...appointmentDetails,
                                date: e.target.value
                              })
                            : setNewAppointment({
                                ...newAppointment,
                                date: e.target.value
                              })
                        }
                      />
                    </div>
                    <div className='grid gap-2'>
                      <label htmlFor='time'>Heure de début</label>
                      <Input
                        id='time'
                        type='time'
                        value={
                          appointmentDetails
                            ? appointmentDetails.time
                            : newAppointment.time
                        }
                        onChange={(e) =>
                          appointmentDetails
                            ? setAppointmentDetails({
                                ...appointmentDetails,
                                time: e.target.value
                              })
                            : setNewAppointment({
                                ...newAppointment,
                                time: e.target.value
                              })
                        }
                      />
                    </div>
                  </div>
                  <div className='grid grid-cols-2 gap-4'>
                    <div className='grid gap-2'>
                      <label htmlFor='endTime'>Heure de fin</label>
                      <Input
                        id='endTime'
                        type='time'
                        value={
                          appointmentDetails
                            ? appointmentDetails.endTime
                            : newAppointment.endTime
                        }
                        onChange={(e) =>
                          appointmentDetails
                            ? setAppointmentDetails({
                                ...appointmentDetails,
                                endTime: e.target.value
                              })
                            : setNewAppointment({
                                ...newAppointment,
                                endTime: e.target.value
                              })
                        }
                      />
                    </div>
                    <div className='grid gap-2'>
                      <label htmlFor='status'>Statut</label>
                      <Select
                        value={
                          appointmentDetails
                            ? appointmentDetails.status
                            : newAppointment.status
                        }
                        onValueChange={(value) =>
                          appointmentDetails
                            ? setAppointmentDetails({
                                ...appointmentDetails,
                                status: value
                              })
                            : setNewAppointment({
                                ...newAppointment,
                                status: value
                              })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='Sélectionner un statut' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='confirmed'>Confirmé</SelectItem>
                          <SelectItem value='pending'>En attente</SelectItem>
                          <SelectItem value='cancelled'>Annulé</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className='grid gap-2'>
                    <label htmlFor='service'>Service</label>
                    <Select
                      value={
                        appointmentDetails
                          ? appointmentDetails.service
                          : newAppointment.service
                      }
                      onValueChange={(value) =>
                        appointmentDetails
                          ? setAppointmentDetails({
                              ...appointmentDetails,
                              service: value
                            })
                          : setNewAppointment({
                              ...newAppointment,
                              service: value
                            })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Sélectionner un service' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='Consultation'>
                          Consultation
                        </SelectItem>
                        <SelectItem value='Check-up'>Check-up</SelectItem>
                        <SelectItem value='Téléconsultation'>
                          Téléconsultation
                        </SelectItem>
                        <SelectItem value='Examen'>Examen</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='grid gap-2'>
                    <label htmlFor='notes'>Notes</label>
                    <Textarea
                      id='notes'
                      value={
                        appointmentDetails
                          ? appointmentDetails.notes
                          : newAppointment.notes
                      }
                      onChange={(e) =>
                        appointmentDetails
                          ? setAppointmentDetails({
                              ...appointmentDetails,
                              notes: e.target.value
                            })
                          : setNewAppointment({
                              ...newAppointment,
                              notes: e.target.value
                            })
                      }
                      placeholder='Notes concernant le rendez-vous'
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant='outline'
                    onClick={() => {
                      setShowAppointmentDialog(false);
                      setAppointmentDetails(null);
                    }}
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={
                      appointmentDetails
                        ? handleUpdateAppointment
                        : handleAddAppointment
                    }
                  >
                    {appointmentDetails ? 'Mettre à jour' : 'Ajouter'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>Rendez-vous à venir</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                {upcomingAppointments}
              </CardTitle>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='flex gap-2 font-medium'>
                <IconCalendar className='size-4' /> {selectedDoctor}
              </div>
            </CardFooter>
          </Card>
          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>Rendez-vous confirmés</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                {confirmedCount}
              </CardTitle>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='flex gap-2 font-medium'>
                <StatusBadge status='confirmed' />{' '}
                {doctorAppointments.length > 0
                  ? Math.round(
                      (confirmedCount / doctorAppointments.length) * 100
                    )
                  : 0}
                % du total
              </div>
            </CardFooter>
          </Card>
          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>Rendez-vous en attente</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                {pendingCount}
              </CardTitle>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='flex gap-2 font-medium'>
                <StatusBadge status='pending' />{' '}
                {doctorAppointments.length > 0
                  ? Math.round((pendingCount / doctorAppointments.length) * 100)
                  : 0}
                % du total
              </div>
            </CardFooter>
          </Card>
        </div>

        {/* Calendar navigation */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Button variant='outline' size='icon' onClick={handlePreviousWeek}>
              <IconChevronLeft className='size-4' />
            </Button>
            <Button variant='outline' onClick={handleCurrentWeek}>
              Aujourd'hui
            </Button>
            <Button variant='outline' size='icon' onClick={handleNextWeek}>
              <IconChevronRight className='size-4' />
            </Button>
          </div>
          <div className='font-semibold'>
            {weekDates[0].toLocaleDateString('fr-FR', {
              month: 'long',
              year: 'numeric'
            })}
          </div>
        </div>

        {/* Calendar */}
        <Card>
          <CardContent className='p-0'>
            <div className='overflow-x-auto'>
              <div className='min-w-[800px]'>
                {/* Calendar header */}
                <div className='grid grid-cols-8 border-b'>
                  <div className='border-r p-2 text-center font-semibold'>
                    Horaire
                  </div>
                  {weekDates.map((date, index) => (
                    <div
                      key={index}
                      className={`p-2 text-center ${
                        date.toDateString() === new Date().toDateString()
                          ? 'bg-blue-50'
                          : ''
                      }`}
                    >
                      <div className='font-semibold'>{daysOfWeek[index]}</div>
                      <div>{formatDate(date)}</div>
                      <div className='mt-1'>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-6 text-xs'
                          onClick={() => handleEditAvailability(date)}
                        >
                          <IconCalendarEvent size={12} className='mr-1' />
                          Disponibilité
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Calendar body */}
                {timeSlots.map((timeSlot) => (
                  <div key={timeSlot} className='grid grid-cols-8 border-b'>
                    <div className='border-r p-2 text-center'>{timeSlot}</div>
                    {weekDates.map((date, dateIndex) => {
                      const appointment = getAppointmentForSlot(date, timeSlot);
                      const isAvailable = isTimeSlotAvailable(date, timeSlot);

                      return (
                        <div
                          key={dateIndex}
                          className={`relative p-1 ${
                            date.toDateString() === new Date().toDateString()
                              ? 'bg-blue-50'
                              : ''
                          } ${isAvailable ? '' : 'bg-gray-100'}`}
                        >
                          {appointment ? (
                            <div
                              className={`cursor-pointer rounded p-1 text-xs ${
                                appointment.status === 'confirmed'
                                  ? 'bg-green-100'
                                  : appointment.status === 'pending'
                                    ? 'bg-yellow-100'
                                    : 'bg-red-100'
                              }`}
                              onClick={() => handleEditAppointment(appointment)}
                            >
                              <div className='font-semibold'>
                                {appointment.patientName}
                              </div>
                              <div>{appointment.service}</div>
                              <div className='mt-1 flex justify-between'>
                                <span>{appointment.time}</span>
                                <StatusBadge status={appointment.status} />
                              </div>
                            </div>
                          ) : isAvailable ? (
                            <div
                              className='h-full cursor-pointer rounded border border-dashed border-gray-300 p-1 text-center hover:bg-blue-50'
                              onClick={() => {
                                setNewAppointment({
                                  ...newAppointment,
                                  date: formatDateForComparison(date),
                                  time: timeSlot,
                                  endTime: timeSlot.split(':')[0] + ':30'
                                });
                                setShowAppointmentDialog(true);
                              }}
                            >
                              <IconPlus
                                size={12}
                                className='m-auto text-gray-400'
                              />
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Availability Dialog */}
        <Dialog
          open={showAvailabilityDialog}
          onOpenChange={setShowAvailabilityDialog}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Gérer la disponibilité</DialogTitle>
              <DialogDescription>
                Définissez votre disponibilité pour {selectedDay}
              </DialogDescription>
            </DialogHeader>
            {selectedDayAvailability && (
              <div className='grid gap-4 py-4'>
                <div className='flex items-center space-x-2'>
                  <Switch
                    id='isAvailable'
                    checked={selectedDayAvailability.isAvailable}
                    onCheckedChange={(checked) =>
                      setSelectedDayAvailability({
                        ...selectedDayAvailability,
                        isAvailable: checked,
                        slots: checked ? selectedDayAvailability.slots : []
                      })
                    }
                  />
                  <Label htmlFor='isAvailable'>Disponible ce jour</Label>
                </div>

                {selectedDayAvailability.isAvailable && (
                  <>
                    <div className='mt-4'>
                      <h4 className='mb-2 font-medium'>Plages horaires</h4>
                      {selectedDayAvailability.slots.map((slot, index) => (
                        <div
                          key={index}
                          className='mb-2 flex items-center gap-2'
                        >
                          <div className='grid grid-cols-2 gap-2'>
                            <div>
                              <label
                                htmlFor={`startTime-${index}`}
                                className='text-sm'
                              >
                                Début
                              </label>
                              <Input
                                id={`startTime-${index}`}
                                type='time'
                                value={slot.startTime}
                                onChange={(e) =>
                                  handleUpdateTimeSlot(
                                    index,
                                    'startTime',
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                            <div>
                              <label
                                htmlFor={`endTime-${index}`}
                                className='text-sm'
                              >
                                Fin
                              </label>
                              <Input
                                id={`endTime-${index}`}
                                type='time'
                                value={slot.endTime}
                                onChange={(e) =>
                                  handleUpdateTimeSlot(
                                    index,
                                    'endTime',
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                          </div>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='mt-5'
                            onClick={() => handleRemoveTimeSlot(index)}
                          >
                            <IconTrash size={16} />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant='outline'
                        className='mt-2'
                        onClick={handleAddTimeSlot}
                      >
                        <IconPlus size={16} className='mr-1' /> Ajouter une
                        plage
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => setShowAvailabilityDialog(false)}
              >
                Annuler
              </Button>
              <Button onClick={handleUpdateAvailability}>Enregistrer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Today's appointments */}
        <div className='mt-6'>
          <h3 className='mb-4 text-lg font-medium'>Rendez-vous du jour</h3>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {doctorAppointments
              .filter(
                (a) =>
                  a.date === formatDateForComparison(new Date()) &&
                  a.status !== 'cancelled'
              )
              .slice(0, 3)
              .map((appointment) => (
                <Card key={`today-${appointment.id}`}>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <IconUser size={18} />
                      {appointment.patientName}
                    </CardTitle>
                    <CardDescription className='flex items-center gap-2'>
                      <IconClock size={16} />
                      {appointment.time} - {appointment.endTime}
                      <StatusBadge status={appointment.status} />
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className='flex justify-between text-sm'>
                      <span className='text-muted-foreground'>Service:</span>
                      <span>{appointment.service}</span>
                    </div>
                    <div className='mt-2 flex justify-between text-sm'>
                      <span className='text-muted-foreground'>Notes:</span>
                      <span>{appointment.notes || 'Aucune note'}</span>
                    </div>
                  </CardContent>
                  <CardFooter className='flex justify-end gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => handleEditAppointment(appointment)}
                    >
                      <IconEdit size={16} className='mr-1' />
                      Modifier
                    </Button>
                    <Button
                      variant='destructive'
                      size='sm'
                      onClick={() => handleDeleteAppointment(appointment.id)}
                    >
                      <IconTrash size={16} className='mr-1' />
                      Annuler
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            {doctorAppointments.filter(
              (a) =>
                a.date === formatDateForComparison(new Date()) &&
                a.status !== 'cancelled'
            ).length === 0 && (
              <div className='col-span-full text-center text-gray-500'>
                Aucun rendez-vous pour aujourd'hui
              </div>
            )}
          </div>
        </div>

        {/* Summary of availability */}
        <div className='mt-6'>
          <h3 className='mb-4 text-lg font-medium'>
            Récapitulatif des disponibilités
          </h3>
          <Card>
            <CardContent className='p-4'>
              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7'>
                {availability.map((avail) => (
                  <div
                    key={avail.id}
                    className={`rounded border p-3 ${
                      avail.isAvailable
                        ? 'border-green-300 bg-green-50'
                        : 'border-red-300 bg-red-50'
                    }`}
                  >
                    <div className='font-medium'>{avail.day}</div>
                    {avail.isAvailable ? (
                      <div className='mt-2 text-sm'>
                        {avail.slots.map((slot, idx) => (
                          <div key={idx} className='flex gap-1'>
                            <IconClock size={14} className='mt-0.5' />
                            {slot.startTime} - {slot.endTime}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className='mt-2 text-sm text-red-700'>
                        <IconX size={14} className='mr-1 inline' />
                        Non disponible
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
