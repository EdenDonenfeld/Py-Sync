# Function to calculate factorial iteratively
def factorial_iterative(n):
    result = 1
    for i in range(1, n + 1):
        result *= i
    return result
# Function to calculate factorial recursively
def factorial_recursive(n):
    if n == 0:
        return 1
    else:
        return n * factorial_recursive(n - 1)
# Test the functions
number = 5
print(f"Factorial of {number} (iterative): {factorial_iterative(number)}")
print(f"Factorial of {number} (recursive): {factorial_recursive(number)}")