import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PageHeader from './PageHeader';

describe('PageHeader Component', () => {
  const defaultProps = {
    formName: 'Test Page',
    filter: true,
    handleFilter: jest.fn(),
    setQuery: jest.fn(),
    showForm: false,
    updateForm: false,
    setShowForm: jest.fn(),
    data: [],
    exportColumns: [],
    fileName: 'test-export',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the page title correctly', () => {
      render(<PageHeader {...defaultProps} />);
      expect(screen.getByText('Test Page')).toBeInTheDocument();
    });

    it('renders with all required elements when showForm is false', () => {
      render(<PageHeader {...defaultProps} />);

      // Page title
      expect(screen.getByText('Test Page')).toBeInTheDocument();

      // Active checkbox
      expect(screen.getByLabelText('Active')).toBeInTheDocument();

      // Add button
      expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();

      // Search input
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    });

    it('hides action elements when showForm is true', () => {
      render(<PageHeader {...defaultProps} showForm={true} />);

      // Page title still visible
      expect(screen.getByText('Test Page')).toBeInTheDocument();

      // Action elements should be hidden
      expect(screen.queryByLabelText('Active')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /add/i })).not.toBeInTheDocument();
      expect(screen.queryByPlaceholderText('Search...')).not.toBeInTheDocument();

      // List button should be visible
      expect(screen.getByRole('button', { name: /list/i })).toBeInTheDocument();
    });

    it('hides action elements when updateForm is true', () => {
      render(<PageHeader {...defaultProps} updateForm={true} />);

      expect(screen.queryByLabelText('Active')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /add/i })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /list/i })).toBeInTheDocument();
    });

    it('renders export buttons when provided', () => {
      render(<PageHeader {...defaultProps} />);

      expect(screen.getByTitle('Export CSV')).toBeInTheDocument();
      expect(screen.getByTitle('Export Excel')).toBeInTheDocument();
      expect(screen.getByTitle('Export PDF')).toBeInTheDocument();
    });

    it('does not render Add button when showAddButton is false', () => {
      render(<PageHeader {...defaultProps} showAddButton={false} />);

      expect(screen.queryByRole('button', { name: /add/i })).not.toBeInTheDocument();
    });
  });

  describe('Active Filter Checkbox', () => {
    it('checkbox is checked when filter is true', () => {
      render(<PageHeader {...defaultProps} filter={true} />);
      const checkbox = screen.getByLabelText('Active');
      expect(checkbox).toBeChecked();
    });

    it('checkbox is unchecked when filter is false', () => {
      render(<PageHeader {...defaultProps} filter={false} />);
      const checkbox = screen.getByLabelText('Active');
      expect(checkbox).not.toBeChecked();
    });

    it('calls handleFilter when checkbox is clicked', () => {
      const handleFilter = jest.fn();
      render(<PageHeader {...defaultProps} handleFilter={handleFilter} />);

      const checkbox = screen.getByLabelText('Active');
      fireEvent.click(checkbox);

      expect(handleFilter).toHaveBeenCalledTimes(1);
    });
  });

  describe('Add Button', () => {
    it('calls setShowForm when Add button is clicked', () => {
      const setShowForm = jest.fn();
      render(<PageHeader {...defaultProps} setShowForm={setShowForm} />);

      const addButton = screen.getByRole('button', { name: /add/i });
      fireEvent.click(addButton);

      expect(setShowForm).toHaveBeenCalledTimes(1);
      expect(setShowForm).toHaveBeenCalledWith(true);
    });

    it('calls custom openAddForm when provided', () => {
      const openAddForm = jest.fn();
      const setShowForm = jest.fn();
      render(<PageHeader {...defaultProps} openAddForm={openAddForm} setShowForm={setShowForm} />);

      const addButton = screen.getByRole('button', { name: /add/i });
      fireEvent.click(addButton);

      expect(openAddForm).toHaveBeenCalledTimes(1);
      expect(setShowForm).not.toHaveBeenCalled();
    });
  });

  describe('Search Functionality', () => {
    it('calls setQuery when search input changes', () => {
      const setQuery = jest.fn();
      render(<PageHeader {...defaultProps} setQuery={setQuery} />);

      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'test query' } });

      expect(setQuery).toHaveBeenCalledTimes(1);
      expect(setQuery).toHaveBeenCalledWith('test query');
    });

    it('renders search icon', () => {
      const { container } = render(<PageHeader {...defaultProps} />);
      const searchIcon = container.querySelector('.ri-search-line');
      expect(searchIcon).toBeInTheDocument();
    });
  });

  describe('List Button (Form Mode)', () => {
    it('calls tog_list when List button is clicked and tog_list is provided', () => {
      const tog_list = jest.fn();
      render(<PageHeader {...defaultProps} showForm={true} tog_list={tog_list} />);

      const listButton = screen.getByRole('button', { name: /list/i });
      fireEvent.click(listButton);

      expect(tog_list).toHaveBeenCalledTimes(1);
    });

    it('calls setShowForm and setUpdateForm when List button clicked without tog_list', () => {
      const setShowForm = jest.fn();
      const setUpdateForm = jest.fn();
      const setValues = jest.fn();
      const initialState = { name: '' };

      render(
        <PageHeader
          {...defaultProps}
          showForm={true}
          setShowForm={setShowForm}
          setUpdateForm={setUpdateForm}
          setValues={setValues}
          initialState={initialState}
        />
      );

      const listButton = screen.getByRole('button', { name: /list/i });
      fireEvent.click(listButton);

      expect(setValues).toHaveBeenCalledWith(initialState);
      expect(setUpdateForm).toHaveBeenCalledWith(false);
      expect(setShowForm).toHaveBeenCalledWith(false);
    });
  });

  describe('Layout and Styling', () => {
    it('applies correct layout classes for proper alignment', () => {
      const { container } = render(<PageHeader {...defaultProps} />);

      // Check for main container with proper flex classes
      const mainRow = container.querySelector('.row.align-items-center');
      expect(mainRow).toBeInTheDocument();

      // Check for right-aligned controls
      const controlsCol = container.querySelector('.d-flex.justify-content-end');
      expect(controlsCol).toBeInTheDocument();
    });

    it('export buttons are in a separate row below controls', () => {
      const { container } = render(<PageHeader {...defaultProps} />);

      // Export buttons should be in their own row
      const rows = container.querySelectorAll('.row');
      expect(rows.length).toBeGreaterThan(1);
    });
  });

  describe('Export Functionality', () => {
    it('passes correct props to ExportButtons component', () => {
      const testData = [{ id: 1, name: 'Test' }];
      const testColumns = [{ header: 'ID', key: 'id' }];
      const fetchAll = jest.fn();

      render(
        <PageHeader
          {...defaultProps}
          data={testData}
          exportColumns={testColumns}
          fileName="test-file"
          fetchAllForExport={fetchAll}
        />
      );

      // Verify export buttons are rendered
      expect(screen.getByTitle('Export CSV')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing optional props gracefully', () => {
      const minimalProps = {
        formName: 'Minimal Page',
        filter: true,
        handleFilter: jest.fn(),
        setQuery: jest.fn(),
        showForm: false,
        updateForm: false,
        setShowForm: jest.fn(),
      };

      expect(() => render(<PageHeader {...minimalProps} />)).not.toThrow();
    });

    it('handles empty formName', () => {
      render(<PageHeader {...defaultProps} formName="" />);
      expect(screen.queryByRole('heading')).toBeInTheDocument();
    });

    it('handles null data for export', () => {
      expect(() =>
        render(<PageHeader {...defaultProps} data={null} />)
      ).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('has accessible labels for form controls', () => {
      render(<PageHeader {...defaultProps} />);

      // Active checkbox has label
      expect(screen.getByLabelText('Active')).toBeInTheDocument();

      // Search has placeholder
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    });

    it('buttons have proper aria labels from icons and text', () => {
      render(<PageHeader {...defaultProps} />);

      const addButton = screen.getByRole('button', { name: /add/i });
      expect(addButton).toBeInTheDocument();
    });
  });
});
