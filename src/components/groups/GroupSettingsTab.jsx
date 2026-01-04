function GroupTabOrderSettings({ group }) {
  const queryClient = useQueryClient();
  
  const defaultOrder = [
    'feed', 'discussion', 'events', 'meetings', 'projects', 
    'marketing', 'assets', 'resources', 'training', 'qna', 
    'members', 'requests'
  ];

  const [items, setItems] = useState(group.settings?.tab_order || defaultOrder);
  const [hasChanges, setHasChanges] = useState(false);

  const updateMutation = useMutation({
    mutationFn: (newOrder) => base44.entities.CreatorGroup.update(group.id, { 
      settings: { ...group.settings, tab_order: newOrder } 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['activeGroup', group.id]);
      setHasChanges(false);
    }
  });

  const onDragEnd = (result) => {
    if (!result.destination) return;
    
    const newItems = Array.from(items);
    const [reorderedItem] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, reorderedItem);
    
    setItems(newItems);
    setHasChanges(true);
  };

  const labels = {
    feed: 'Feed',
    discussion: 'Discussion',
    events: 'Events',
    meetings: 'Meetings',
    projects: 'Projects',
    marketing: 'Marketing Orders',
    assets: 'Brand & Assets',
    resources: 'Resources',
    training: 'Training',
    qna: 'Q&A',
    members: 'Members',
    requests: 'Requests'
  };

  // Ensure all known tabs are in the list (in case new ones were added)
  const currentSet = new Set(items);
  const missingTabs = defaultOrder.filter(id => !currentSet.has(id));
  const fullList = [...items, ...missingTabs];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tab Order</CardTitle>
        <CardDescription>Drag and drop to reorder tabs for your group.</CardDescription>
      </CardHeader>
      <CardContent>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="tabs">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2 max-w-md">
                {fullList.map((id, index) => (
                  <Draggable key={id} draggableId={id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="flex items-center gap-3 p-3 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow"
                      >
                        <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                        <span className="font-medium">{labels[id] || id}</span>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
        
        {hasChanges && (
          <div className="mt-4 flex justify-end">
            <Button onClick={() => updateMutation.mutate(items)} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Order'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}