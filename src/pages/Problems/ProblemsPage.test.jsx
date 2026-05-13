import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AuthContext from "../../context/AuthContext";
import { ThemeProvider } from "../../context/ThemeContext";
import ProblemsPage from "./ProblemsPage";

const renderProblemsPage = () =>
  render(
    <ThemeProvider>
      <AuthContext.Provider
        value={{
          user: { id: "user-1", name: "Atta", email: "atta@example.com" },
          loading: false,
          isAuthenticated: true,
          login: jest.fn(),
          register: jest.fn(),
          logout: jest.fn(),
        }}
      >
        <MemoryRouter
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <ProblemsPage />
        </MemoryRouter>
      </AuthContext.Provider>
    </ThemeProvider>,
  );

beforeEach(() => {
  window.localStorage.clear();
});

test("filters the problem table by search text", () => {
  renderProblemsPage();

  fireEvent.change(
    screen.getByPlaceholderText(/search problems, tags, circuits, latches/i),
    {
      target: { value: "Sequence Detector FSM" },
    },
  );

  expect(screen.getAllByText("Sequence Detector FSM").length).toBeGreaterThan(0);
  expect(screen.queryAllByText("Half Adder")).toHaveLength(0);
});

test("marks a problem as attempted from the table", async () => {
  renderProblemsPage();

  const row = screen.getAllByText("Half Adder")[0].closest("tr");
  const startButton = within(row).getByRole("button", { name: /start/i });
  fireEvent.click(startButton);

  expect(await within(row).findByRole("button", { name: /attempted/i })).toBeInTheDocument();
});
