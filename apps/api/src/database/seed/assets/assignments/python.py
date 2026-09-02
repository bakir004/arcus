import numpy as np

def generate_random_array(size):
    """Generate a random array of the given size."""
    return np.random.rand(size).tolist()

print(generate_random_array(10))  # Example usage: generate an array of size 10

