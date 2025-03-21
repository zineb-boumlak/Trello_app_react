import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Modal, Button, Form, Nav } from 'react-bootstrap';
import { useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Esp.css';
const initialData = {
  columns: {
    'column-1': { id: 'column-1', title: 'À faire', taskIds: [] },
    'column-2': { id: 'column-2', title: 'En cours', taskIds: [] },
    'column-3': { id: 'column-3', title: 'Terminé', taskIds: [] },
  },
  tasks: {},
  columnOrder: ['column-1', 'column-2', 'column-3'],
};

const Espace = () => {
  const [data, setData] = useState(initialData);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showBoardModal, setShowBoardModal] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState(null);
  const [taskDetails, setTaskDetails] = useState({ title: '', description: '' });
  const [boardName, setBoardName] = useState('');
  const [boards, setBoards] = useState([{ name: 'Tableau 1', data: initialData }]); 
  const [currentBoardIndex, setCurrentBoardIndex] = useState(0); 
  const [dat, setDat] = useState(null);
  const [error, setError] = useState('');
 
  useEffect(() => {
    const fetchData = async () => {
        try {
            const response = await axios.get('http://localhost:3001/espace', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });
            setDat(response.data); 
        } catch (err) {
            setError(`Erreur lors de la récupération des données : ${err.message}`);
            console.error(err);
        }
    };

    fetchData();
}, []);

if (error) {
    return <div>{error}</div>;
}

  const handleShowTaskModal = (columnId) => {
    setSelectedColumn(columnId);
    setShowTaskModal(true);
  };

  const handleCloseTaskModal = () => {
    setShowTaskModal(false);
    setTaskDetails({ title: '', description: '' });
  };

  const handleShowBoardModal = () => {
    setShowBoardModal(true);
  };

  const handleCloseBoardModal = () => {
    setShowBoardModal(false);
    setBoardName('');
  };

  const handleAddTask = () => {
    if (!taskDetails.title.trim()) return;

    const newTask = {
      id: `task-${Date.now()}`,
      title: taskDetails.title,
      description: taskDetails.description,
    };

    const updatedTasks = { ...data.tasks, [newTask.id]: newTask };
    const updatedColumn = {
      ...data.columns[selectedColumn],
      taskIds: [...data.columns[selectedColumn].taskIds, newTask.id],
    };
    const updatedColumns = { ...data.columns, [selectedColumn]: updatedColumn };

    setData({ ...data, tasks: updatedTasks, columns: updatedColumns });
    handleCloseTaskModal();
  };

  const handleAddBoard = () => {
    if (!boardName.trim()) return;

    const newBoard = {
      name: boardName,
      data: {
        columns: {
          'column-1': { id: 'column-1', title: 'À faire', taskIds: [] },
          'column-2': { id: 'column-2', title: 'En cours', taskIds: [] },
          'column-3': { id: 'column-3', title: 'Terminé', taskIds: [] },
        },
        tasks: {},
        columnOrder: ['column-1', 'column-2', 'column-3'],
      },
    };

    setBoards([...boards, newBoard]);
    setCurrentBoardIndex(boards.length); 
    setData(newBoard.data); 
    handleCloseBoardModal();
  };
  const handleSwitchBoard = (index) => {
    setCurrentBoardIndex(index);
    setData(boards[index].data);
  };

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceColumn = data.columns[source.droppableId];
    const destinationColumn = data.columns[destination.droppableId];
    const newSourceTaskIds = Array.from(sourceColumn.taskIds);
    newSourceTaskIds.splice(source.index, 1);

    const newDestinationTaskIds = Array.from(destinationColumn.taskIds);
    newDestinationTaskIds.splice(destination.index, 0, draggableId);

    const updatedSourceColumn = { ...sourceColumn, taskIds: newSourceTaskIds };
    const updatedDestinationColumn = { ...destinationColumn, taskIds: newDestinationTaskIds };

    const updatedColumns = {
      ...data.columns,
      [source.droppableId]: updatedSourceColumn,
      [destination.droppableId]: updatedDestinationColumn,
    };

    setData({ ...data, columns: updatedColumns });
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="app-container">
        <Nav className="flex-column sidebar">
          <Nav.Item>
            <Nav.Link onClick={() => handleSwitchBoard(currentBoardIndex)}>
              Espace de travail
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link onClick={handleShowBoardModal}>+ Ajouter un tableau</Nav.Link>
          </Nav.Item>
          {boards.map((board, index) => (
            <Nav.Item key={index}>
              <Nav.Link onClick={() => handleSwitchBoard(index)}>
                {board.name}
              </Nav.Link>
            </Nav.Item>
            
          ))}
        </Nav>
        <div className="main-content">
          <h1 className="text-center my-4">{boards[currentBoardIndex].name}</h1>
          <div>
            
            
        </div>

          <div className="d-flex justify-content-around">
            {data.columnOrder.map((columnId) => {
              const column = data.columns[columnId];
              const tasks = column.taskIds.map((taskId) => data.tasks[taskId]);

              return (
                <Droppable key={column.id} droppableId={column.id}>
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="column"
                    >
                      <h3>{column.title}</h3>
                      {tasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided) => (
                            <div
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              ref={provided.innerRef}
                              className="task-card"
                            >
                              <h5>{task.title}</h5>
                              <p>{task.description}</p>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      <Button
                        variant="primary"
                        className="w-100 mt-2"
                        onClick={() => handleShowTaskModal(column.id)}
                      >
                        + Ajouter une tâche
                      </Button>
                    </div>
                  )}
                </Droppable>
              );
            })}
          </div>

          <Modal show={showTaskModal} onHide={handleCloseTaskModal} centered>
            <Modal.Header closeButton>
              <Modal.Title>Ajouter une tâche</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form>
                <Form.Group>
                  <Form.Label>Titre</Form.Label>
                  <Form.Control
                    type="text"
                    value={taskDetails.title}
                    onChange={(e) => setTaskDetails({ ...taskDetails, title: e.target.value })}
                  />
                </Form.Group>
                <Form.Group>
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={taskDetails.description}
                    onChange={(e) => setTaskDetails({ ...taskDetails, description: e.target.value })}
                  />
                </Form.Group>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleCloseTaskModal}>
                Annuler
              </Button>
              <Button variant="primary" onClick={handleAddTask}>
                Ajouter
              </Button>
            </Modal.Footer>
          </Modal>

          <Modal show={showBoardModal} onHide={handleCloseBoardModal} centered>
            <Modal.Header closeButton>
              <Modal.Title>Ajouter un tableau</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form>
                <Form.Group>
                  <Form.Label>Nom du tableau</Form.Label>
                  <Form.Control
                    type="text"
                    value={boardName}
                    onChange={(e) => setBoardName(e.target.value)}
                    placeholder="Entrez le nom du tableau"
                  />
                </Form.Group>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleCloseBoardModal}>
                Annuler
              </Button>
              <Button variant="primary" onClick={handleAddBoard}>
                OK
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
      </div>
    </DragDropContext>
  );
};

export default Espace;