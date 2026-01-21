from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.layout import Layout
from rich import box

def display_report(stats):
    console = Console()
    
    # Title
    console.print(Panel("[bold blue]Nginx Access Log Analysis Report[/bold blue]", expand=False))
    console.print()

    # Summary Table
    summary_table = Table(box=box.SIMPLE)
    summary_table.add_column("Metric", style="cyan")
    summary_table.add_column("Value", style="magenta")

    summary_table.add_row("Total Requests (PV)", str(stats['total_requests']))
    summary_table.add_row("Unique IPs (UU)", str(stats['unique_users']))
    
    # Calculate data transfer size (MB/GB)
    total_bytes = stats['total_bytes']
    if total_bytes > 1024**3:
        size_str = f"{total_bytes / (1024**3):.2f} GB"
    else:
        size_str = f"{total_bytes / (1024**2):.2f} MB"
    summary_table.add_row("Total Data Transfer", size_str)

    console.print(summary_table)
    console.print()

    # Status Codes Table
    status_table = Table(title="Status Codes", box=box.SIMPLE)
    status_table.add_column("Code", style="green")
    status_table.add_column("Count", justify="right")
    status_table.add_column("Percentage", justify="right")

    for code, count in sorted(stats['status_codes'].items()):
        percentage = (count / stats['total_requests']) * 100
        status_table.add_row(str(code), str(count), f"{percentage:.1f}%")

    console.print(status_table)
    console.print()

    # Top Paths Table
    path_table = Table(title="Top 10 Requested Paths", box=box.SIMPLE)
    path_table.add_column("Rank", style="dim")
    path_table.add_column("Path", style="yellow")
    path_table.add_column("Requests", justify="right")

    for i, (path, count) in enumerate(stats['top_paths'], 1):
        path_table.add_row(str(i), path, str(count))

    console.print(path_table)
