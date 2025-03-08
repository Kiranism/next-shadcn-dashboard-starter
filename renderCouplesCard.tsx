const renderCouplesCard = () => {
  // Extract available players (those not in couples)
  const assignedPlayerIds = new Set();
  couples.forEach((couple) => {
    if (couple.first_player_id) assignedPlayerIds.add(couple.first_player_id);
    if (couple.second_player_id) assignedPlayerIds.add(couple.second_player_id);
  });

  const availablePlayers = tournamentPlayers
    .filter((tp) => !assignedPlayerIds.has(tp.player_id))
    .map((tp) => tp.player);

  return (
    <Card className='overflow-hidden'>
      <CardHeader className='flex-row items-center justify-between space-y-0'>
        <CardTitle>{t('coupleManagement')}</CardTitle>
        <Button
          variant='outline'
          size='sm'
          onClick={() => createNewCouple()}
          disabled={isSavingCouple}
        >
          <Plus className='h-4 w-4' />
          {t('createCouple')}
        </Button>
      </CardHeader>
      <CardContent>
        <DragDropContext
          onDragEnd={handleDragEnd}
          onDragStart={() => setIsDraggingPlayer(true)}
        >
          {loadingCouples ? (
            <div className='space-y-2'>
              <Skeleton className='h-20 w-full' />
              <Skeleton className='h-20 w-full' />
            </div>
          ) : couples.length === 0 ? (
            <div className='rounded-md border py-8 text-center'>
              <p className='mb-4 text-muted-foreground'>
                {t('noCouplesCreated')}
              </p>
              <Button
                variant='outline'
                size='sm'
                onClick={() => createNewCouple()}
              >
                <Plus className='mr-2 h-4 w-4' />
                {t('createCouple')}
              </Button>
            </div>
          ) : (
            <div className='space-y-6'>
              <div className='mb-8 space-y-4'>
                <h3 className='text-sm font-medium'>
                  {t('couples')} ({couples.length})
                </h3>
                {couples.map((couple, index) => (
                  <CoupleCard
                    key={couple.id || `temp-${index}`}
                    couple={couple}
                    t={t}
                    onEdit={() => handleEditCouple(couple)}
                    onDelete={() => handleDeleteCouple(couple)}
                  />
                ))}
              </div>

              <div>
                <h3 className='mb-4 text-sm font-medium'>
                  {t('availablePlayers')} ({availablePlayers.length})
                </h3>
                <Droppable
                  droppableId='available-players'
                  isDropDisabled={false}
                  type='PLAYER'
                >
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className='max-h-[300px] space-y-2 overflow-y-auto rounded-md border p-2'
                    >
                      {availablePlayers.length === 0 ? (
                        <div className='py-4 text-center text-sm text-muted-foreground'>
                          {t('noAvailablePlayers')}
                        </div>
                      ) : (
                        availablePlayers.map((player, index) => (
                          <Draggable
                            key={`player-${player.id}`}
                            draggableId={`player-${player.id}`}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`rounded-md border p-2 ${
                                  snapshot.isDragging
                                    ? 'opacity-60 shadow-lg'
                                    : 'opacity-100'
                                } cursor-move bg-card transition-all duration-200 ease-in-out hover:bg-card/90`}
                              >
                                <div className='flex items-center gap-2'>
                                  <Avatar className='h-8 w-8 flex-shrink-0'>
                                    <AvatarImage
                                      src={player.picture || ''}
                                      alt={player.nickname}
                                    />
                                    <AvatarFallback>
                                      {getInitials(player.nickname)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className='min-w-0 flex-1'>
                                    <p className='truncate text-sm font-medium'>
                                      {player.nickname}
                                    </p>
                                    <p className='text-xs text-muted-foreground'>
                                      {t('level')}:{' '}
                                      {formatPlayerLevel(player.level)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>

              <div className='mt-4 rounded-md bg-muted p-3 text-sm'>
                <p className='flex items-center text-muted-foreground'>
                  <Info className='mr-2 h-4 w-4' />
                  {t('dragPlayerInstructions')}
                </p>
              </div>
            </div>
          )}
        </DragDropContext>
      </CardContent>
    </Card>
  );
};
