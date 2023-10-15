
namespace CommandBuilder {
	partial class FPrincipal {
		/// <summary>
		/// Variable del diseñador necesaria.
		/// </summary>
		private System.ComponentModel.IContainer components = null;

		/// <summary>
		/// Limpiar los recursos que se estén usando.
		/// </summary>
		/// <param name="disposing">true si los recursos administrados se deben desechar; false en caso contrario.</param>
		protected override void Dispose(bool disposing) {
			if(disposing && (components != null)) {
				components.Dispose();
			}
			base.Dispose(disposing);
		}

		#region Código generado por el Diseñador de Windows Forms

		/// <summary>
		/// Método necesario para admitir el Diseñador. No se puede modificar
		/// el contenido de este método con el editor de código.
		/// </summary>
		private void InitializeComponent() {
			System.Windows.Forms.DataGridViewCellStyle dataGridViewCellStyle1 = new System.Windows.Forms.DataGridViewCellStyle();
			System.Windows.Forms.DataGridViewCellStyle dataGridViewCellStyle5 = new System.Windows.Forms.DataGridViewCellStyle();
			System.Windows.Forms.DataGridViewCellStyle dataGridViewCellStyle2 = new System.Windows.Forms.DataGridViewCellStyle();
			System.Windows.Forms.DataGridViewCellStyle dataGridViewCellStyle3 = new System.Windows.Forms.DataGridViewCellStyle();
			System.Windows.Forms.DataGridViewCellStyle dataGridViewCellStyle4 = new System.Windows.Forms.DataGridViewCellStyle();
			this.pnlMetadatos = new System.Windows.Forms.Panel();
			this.pnlContenidoMetadatos = new System.Windows.Forms.Panel();
			this.pnlOpciones = new System.Windows.Forms.Panel();
			this.dgvOpciones = new System.Windows.Forms.DataGridView();
			this.tlpBotonesOpciones = new System.Windows.Forms.TableLayoutPanel();
			this.btnAgregarBandera = new ControLib.SleekButton();
			this.btnAgregarParámetro = new ControLib.SleekButton();
			this.lblOpciones = new System.Windows.Forms.Label();
			this.pnlDescripción = new System.Windows.Forms.Panel();
			this.tbDescripción = new ControLib.SleekTextBox();
			this.lblDescripción = new System.Windows.Forms.Label();
			this.pnlAlias = new System.Windows.Forms.Panel();
			this.tbNuevoAlias = new ControLib.SleekTextBox();
			this.btnNuevoAlias = new ControLib.SleekButton();
			this.pnlNombre = new System.Windows.Forms.Panel();
			this.tbNombre = new ControLib.SleekTextBox();
			this.lblNombre = new System.Windows.Forms.Label();
			this.pnlTítuloMetadatos = new System.Windows.Forms.Panel();
			this.lblMetadatos = new System.Windows.Forms.Label();
			this.btnGenerar = new ControLib.SleekButton();
			this.sflComando = new System.Windows.Forms.SaveFileDialog();
			this.pnlIdentificadores = new System.Windows.Forms.Panel();
			this.tbNuevoIdentificador = new ControLib.SleekTextBox();
			this.btnNuevoIdentificador = new ControLib.SleekButton();
			this.lblIdentificadores = new System.Windows.Forms.Label();
			this.Opción = new System.Windows.Forms.DataGridViewTextBoxColumn();
			this.Nombre = new System.Windows.Forms.DataGridViewTextBoxColumn();
			this.Tipo = new System.Windows.Forms.DataGridViewTextBoxColumn();
			this.pnlMetadatos.SuspendLayout();
			this.pnlContenidoMetadatos.SuspendLayout();
			this.pnlOpciones.SuspendLayout();
			((System.ComponentModel.ISupportInitialize)(this.dgvOpciones)).BeginInit();
			this.tlpBotonesOpciones.SuspendLayout();
			this.pnlDescripción.SuspendLayout();
			this.pnlAlias.SuspendLayout();
			this.pnlNombre.SuspendLayout();
			this.pnlTítuloMetadatos.SuspendLayout();
			this.pnlIdentificadores.SuspendLayout();
			this.SuspendLayout();
			// 
			// pnlMetadatos
			// 
			this.pnlMetadatos.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(18)))), ((int)(((byte)(18)))), ((int)(((byte)(18)))));
			this.pnlMetadatos.Controls.Add(this.pnlContenidoMetadatos);
			this.pnlMetadatos.Controls.Add(this.pnlTítuloMetadatos);
			this.pnlMetadatos.Dock = System.Windows.Forms.DockStyle.Left;
			this.pnlMetadatos.Location = new System.Drawing.Point(0, 0);
			this.pnlMetadatos.Name = "pnlMetadatos";
			this.pnlMetadatos.Size = new System.Drawing.Size(297, 544);
			this.pnlMetadatos.TabIndex = 0;
			// 
			// pnlContenidoMetadatos
			// 
			this.pnlContenidoMetadatos.AutoScroll = true;
			this.pnlContenidoMetadatos.Controls.Add(this.pnlIdentificadores);
			this.pnlContenidoMetadatos.Controls.Add(this.pnlOpciones);
			this.pnlContenidoMetadatos.Controls.Add(this.pnlDescripción);
			this.pnlContenidoMetadatos.Controls.Add(this.pnlAlias);
			this.pnlContenidoMetadatos.Controls.Add(this.pnlNombre);
			this.pnlContenidoMetadatos.Dock = System.Windows.Forms.DockStyle.Fill;
			this.pnlContenidoMetadatos.Location = new System.Drawing.Point(0, 45);
			this.pnlContenidoMetadatos.Name = "pnlContenidoMetadatos";
			this.pnlContenidoMetadatos.Padding = new System.Windows.Forms.Padding(12, 8, 12, 8);
			this.pnlContenidoMetadatos.Size = new System.Drawing.Size(297, 499);
			this.pnlContenidoMetadatos.TabIndex = 3;
			// 
			// pnlOpciones
			// 
			this.pnlOpciones.Controls.Add(this.dgvOpciones);
			this.pnlOpciones.Controls.Add(this.tlpBotonesOpciones);
			this.pnlOpciones.Controls.Add(this.lblOpciones);
			this.pnlOpciones.Dock = System.Windows.Forms.DockStyle.Top;
			this.pnlOpciones.Location = new System.Drawing.Point(12, 273);
			this.pnlOpciones.Name = "pnlOpciones";
			this.pnlOpciones.Padding = new System.Windows.Forms.Padding(0, 0, 0, 6);
			this.pnlOpciones.Size = new System.Drawing.Size(273, 161);
			this.pnlOpciones.TabIndex = 3;
			// 
			// dgvOpciones
			// 
			this.dgvOpciones.AllowUserToAddRows = false;
			this.dgvOpciones.AllowUserToDeleteRows = false;
			this.dgvOpciones.AllowUserToResizeColumns = false;
			this.dgvOpciones.AllowUserToResizeRows = false;
			this.dgvOpciones.BackgroundColor = System.Drawing.Color.FromArgb(((int)(((byte)(20)))), ((int)(((byte)(27)))), ((int)(((byte)(33)))));
			this.dgvOpciones.BorderStyle = System.Windows.Forms.BorderStyle.None;
			this.dgvOpciones.CellBorderStyle = System.Windows.Forms.DataGridViewCellBorderStyle.None;
			this.dgvOpciones.ColumnHeadersBorderStyle = System.Windows.Forms.DataGridViewHeaderBorderStyle.None;
			dataGridViewCellStyle1.Alignment = System.Windows.Forms.DataGridViewContentAlignment.MiddleCenter;
			dataGridViewCellStyle1.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(27)))), ((int)(((byte)(35)))), ((int)(((byte)(44)))));
			dataGridViewCellStyle1.Font = new System.Drawing.Font("Segoe UI", 11F);
			dataGridViewCellStyle1.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(80)))), ((int)(((byte)(105)))), ((int)(((byte)(133)))));
			dataGridViewCellStyle1.SelectionBackColor = System.Drawing.SystemColors.Highlight;
			dataGridViewCellStyle1.SelectionForeColor = System.Drawing.SystemColors.HighlightText;
			this.dgvOpciones.ColumnHeadersDefaultCellStyle = dataGridViewCellStyle1;
			this.dgvOpciones.ColumnHeadersHeightSizeMode = System.Windows.Forms.DataGridViewColumnHeadersHeightSizeMode.DisableResizing;
			this.dgvOpciones.Columns.AddRange(new System.Windows.Forms.DataGridViewColumn[] {
            this.Opción,
            this.Nombre,
            this.Tipo});
			dataGridViewCellStyle5.Alignment = System.Windows.Forms.DataGridViewContentAlignment.MiddleCenter;
			dataGridViewCellStyle5.BackColor = System.Drawing.SystemColors.Window;
			dataGridViewCellStyle5.Font = new System.Drawing.Font("Segoe UI", 11F);
			dataGridViewCellStyle5.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(236)))), ((int)(((byte)(236)))), ((int)(((byte)(236)))));
			dataGridViewCellStyle5.SelectionBackColor = System.Drawing.SystemColors.Highlight;
			dataGridViewCellStyle5.SelectionForeColor = System.Drawing.SystemColors.HighlightText;
			dataGridViewCellStyle5.WrapMode = System.Windows.Forms.DataGridViewTriState.False;
			this.dgvOpciones.DefaultCellStyle = dataGridViewCellStyle5;
			this.dgvOpciones.Dock = System.Windows.Forms.DockStyle.Fill;
			this.dgvOpciones.EditMode = System.Windows.Forms.DataGridViewEditMode.EditProgrammatically;
			this.dgvOpciones.EnableHeadersVisualStyles = false;
			this.dgvOpciones.GridColor = System.Drawing.Color.FromArgb(((int)(((byte)(48)))), ((int)(((byte)(48)))), ((int)(((byte)(48)))));
			this.dgvOpciones.Location = new System.Drawing.Point(0, 57);
			this.dgvOpciones.MultiSelect = false;
			this.dgvOpciones.Name = "dgvOpciones";
			this.dgvOpciones.ReadOnly = true;
			this.dgvOpciones.RowHeadersVisible = false;
			this.dgvOpciones.RowHeadersWidthSizeMode = System.Windows.Forms.DataGridViewRowHeadersWidthSizeMode.DisableResizing;
			this.dgvOpciones.Size = new System.Drawing.Size(273, 98);
			this.dgvOpciones.StandardTab = true;
			this.dgvOpciones.TabIndex = 1;
			// 
			// tlpBotonesOpciones
			// 
			this.tlpBotonesOpciones.ColumnCount = 2;
			this.tlpBotonesOpciones.ColumnStyles.Add(new System.Windows.Forms.ColumnStyle(System.Windows.Forms.SizeType.Percent, 50F));
			this.tlpBotonesOpciones.ColumnStyles.Add(new System.Windows.Forms.ColumnStyle(System.Windows.Forms.SizeType.Percent, 50F));
			this.tlpBotonesOpciones.Controls.Add(this.btnAgregarBandera, 1, 0);
			this.tlpBotonesOpciones.Controls.Add(this.btnAgregarParámetro, 0, 0);
			this.tlpBotonesOpciones.Dock = System.Windows.Forms.DockStyle.Top;
			this.tlpBotonesOpciones.Location = new System.Drawing.Point(0, 15);
			this.tlpBotonesOpciones.Name = "tlpBotonesOpciones";
			this.tlpBotonesOpciones.RowCount = 1;
			this.tlpBotonesOpciones.RowStyles.Add(new System.Windows.Forms.RowStyle(System.Windows.Forms.SizeType.Percent, 50F));
			this.tlpBotonesOpciones.Size = new System.Drawing.Size(273, 42);
			this.tlpBotonesOpciones.TabIndex = 0;
			// 
			// btnAgregarBandera
			// 
			this.btnAgregarBandera.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(23)))), ((int)(((byte)(35)))), ((int)(((byte)(48)))));
			this.btnAgregarBandera.BorderColor = System.Drawing.Color.FromArgb(((int)(((byte)(48)))), ((int)(((byte)(48)))), ((int)(((byte)(48)))));
			this.btnAgregarBandera.BorderRadius = 100F;
			this.btnAgregarBandera.BorderSize = 0F;
			this.btnAgregarBandera.Dock = System.Windows.Forms.DockStyle.Fill;
			this.btnAgregarBandera.FlatAppearance.BorderSize = 0;
			this.btnAgregarBandera.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
			this.btnAgregarBandera.Font = new System.Drawing.Font("Segoe UI Semibold", 11F);
			this.btnAgregarBandera.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(246)))), ((int)(((byte)(246)))), ((int)(((byte)(246)))));
			this.btnAgregarBandera.Location = new System.Drawing.Point(136, 0);
			this.btnAgregarBandera.Margin = new System.Windows.Forms.Padding(0, 0, 0, 3);
			this.btnAgregarBandera.Name = "btnAgregarBandera";
			this.btnAgregarBandera.PercentualRadius = true;
			this.btnAgregarBandera.Size = new System.Drawing.Size(137, 39);
			this.btnAgregarBandera.TabIndex = 1;
			this.btnAgregarBandera.Text = "Nueva Bandera";
			this.btnAgregarBandera.UseVisualStyleBackColor = false;
			// 
			// btnAgregarParámetro
			// 
			this.btnAgregarParámetro.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(23)))), ((int)(((byte)(35)))), ((int)(((byte)(48)))));
			this.btnAgregarParámetro.BorderColor = System.Drawing.Color.FromArgb(((int)(((byte)(48)))), ((int)(((byte)(48)))), ((int)(((byte)(48)))));
			this.btnAgregarParámetro.BorderRadius = 100F;
			this.btnAgregarParámetro.BorderSize = 0F;
			this.btnAgregarParámetro.Dock = System.Windows.Forms.DockStyle.Fill;
			this.btnAgregarParámetro.FlatAppearance.BorderSize = 0;
			this.btnAgregarParámetro.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
			this.btnAgregarParámetro.Font = new System.Drawing.Font("Segoe UI Semibold", 11F);
			this.btnAgregarParámetro.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(246)))), ((int)(((byte)(246)))), ((int)(((byte)(246)))));
			this.btnAgregarParámetro.Location = new System.Drawing.Point(0, 0);
			this.btnAgregarParámetro.Margin = new System.Windows.Forms.Padding(0, 0, 0, 3);
			this.btnAgregarParámetro.Name = "btnAgregarParámetro";
			this.btnAgregarParámetro.PercentualRadius = true;
			this.btnAgregarParámetro.Size = new System.Drawing.Size(136, 39);
			this.btnAgregarParámetro.TabIndex = 0;
			this.btnAgregarParámetro.Text = "Nuevo Parám.";
			this.btnAgregarParámetro.UseVisualStyleBackColor = false;
			// 
			// lblOpciones
			// 
			this.lblOpciones.AutoSize = true;
			this.lblOpciones.Dock = System.Windows.Forms.DockStyle.Top;
			this.lblOpciones.Font = new System.Drawing.Font("Lato Black", 9F);
			this.lblOpciones.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(98)))), ((int)(((byte)(98)))), ((int)(((byte)(136)))));
			this.lblOpciones.Location = new System.Drawing.Point(0, 0);
			this.lblOpciones.Name = "lblOpciones";
			this.lblOpciones.Size = new System.Drawing.Size(70, 15);
			this.lblOpciones.TabIndex = 1;
			this.lblOpciones.Text = "OPCIONES";
			this.lblOpciones.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
			// 
			// pnlDescripción
			// 
			this.pnlDescripción.Controls.Add(this.tbDescripción);
			this.pnlDescripción.Controls.Add(this.lblDescripción);
			this.pnlDescripción.Dock = System.Windows.Forms.DockStyle.Top;
			this.pnlDescripción.Location = new System.Drawing.Point(12, 113);
			this.pnlDescripción.Name = "pnlDescripción";
			this.pnlDescripción.Padding = new System.Windows.Forms.Padding(0, 0, 0, 6);
			this.pnlDescripción.Size = new System.Drawing.Size(273, 160);
			this.pnlDescripción.TabIndex = 2;
			// 
			// tbDescripción
			// 
			this.tbDescripción.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(27)))), ((int)(((byte)(35)))), ((int)(((byte)(44)))));
			this.tbDescripción.BorderColor = System.Drawing.Color.FromArgb(((int)(((byte)(48)))), ((int)(((byte)(48)))), ((int)(((byte)(48)))));
			this.tbDescripción.BorderRadius = 16F;
			this.tbDescripción.BorderSize = 0F;
			this.tbDescripción.Cursor = System.Windows.Forms.Cursors.IBeam;
			this.tbDescripción.Dock = System.Windows.Forms.DockStyle.Fill;
			this.tbDescripción.FocusColor = System.Drawing.Color.Empty;
			this.tbDescripción.Font = new System.Drawing.Font("Microsoft Sans Serif", 11F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
			this.tbDescripción.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(236)))), ((int)(((byte)(236)))), ((int)(((byte)(236)))));
			this.tbDescripción.InputColor = System.Drawing.Color.FromArgb(((int)(((byte)(236)))), ((int)(((byte)(236)))), ((int)(((byte)(236)))));
			this.tbDescripción.InputText = "";
			this.tbDescripción.Location = new System.Drawing.Point(0, 15);
			this.tbDescripción.MinimumSize = new System.Drawing.Size(20, 20);
			this.tbDescripción.Multiline = true;
			this.tbDescripción.Name = "tbDescripción";
			this.tbDescripción.PasswordChar = '\0';
			this.tbDescripción.PercentualRadius = false;
			this.tbDescripción.PlaceHolder = "Descripción";
			this.tbDescripción.PlaceHolderColor = System.Drawing.Color.FromArgb(((int)(((byte)(55)))), ((int)(((byte)(73)))), ((int)(((byte)(94)))));
			this.tbDescripción.ReadOnly = false;
			this.tbDescripción.SelectAllOnClick = true;
			this.tbDescripción.Size = new System.Drawing.Size(273, 139);
			this.tbDescripción.Style = ControLib.SleekTextBox.TextBoxStyle.RoundRect;
			this.tbDescripción.TabIndex = 0;
			this.tbDescripción.TextAlign = System.Windows.Forms.HorizontalAlignment.Left;
			this.tbDescripción.WordWrap = true;
			// 
			// lblDescripción
			// 
			this.lblDescripción.AutoSize = true;
			this.lblDescripción.Dock = System.Windows.Forms.DockStyle.Top;
			this.lblDescripción.Font = new System.Drawing.Font("Lato Black", 9F);
			this.lblDescripción.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(98)))), ((int)(((byte)(98)))), ((int)(((byte)(136)))));
			this.lblDescripción.Location = new System.Drawing.Point(0, 0);
			this.lblDescripción.Name = "lblDescripción";
			this.lblDescripción.Size = new System.Drawing.Size(89, 15);
			this.lblDescripción.TabIndex = 1;
			this.lblDescripción.Text = "DESCRIPCIÓN";
			this.lblDescripción.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
			// 
			// pnlAlias
			// 
			this.pnlAlias.Controls.Add(this.tbNuevoAlias);
			this.pnlAlias.Controls.Add(this.btnNuevoAlias);
			this.pnlAlias.Dock = System.Windows.Forms.DockStyle.Top;
			this.pnlAlias.Location = new System.Drawing.Point(12, 68);
			this.pnlAlias.Name = "pnlAlias";
			this.pnlAlias.Padding = new System.Windows.Forms.Padding(0, 0, 0, 6);
			this.pnlAlias.Size = new System.Drawing.Size(273, 45);
			this.pnlAlias.TabIndex = 1;
			// 
			// tbNuevoAlias
			// 
			this.tbNuevoAlias.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(27)))), ((int)(((byte)(35)))), ((int)(((byte)(44)))));
			this.tbNuevoAlias.BorderColor = System.Drawing.Color.FromArgb(((int)(((byte)(48)))), ((int)(((byte)(48)))), ((int)(((byte)(48)))));
			this.tbNuevoAlias.BorderRadius = 100F;
			this.tbNuevoAlias.BorderSize = 0F;
			this.tbNuevoAlias.Cursor = System.Windows.Forms.Cursors.IBeam;
			this.tbNuevoAlias.Dock = System.Windows.Forms.DockStyle.Fill;
			this.tbNuevoAlias.FocusColor = System.Drawing.Color.Empty;
			this.tbNuevoAlias.Font = new System.Drawing.Font("Microsoft Sans Serif", 11F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
			this.tbNuevoAlias.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(236)))), ((int)(((byte)(236)))), ((int)(((byte)(236)))));
			this.tbNuevoAlias.InputColor = System.Drawing.Color.FromArgb(((int)(((byte)(236)))), ((int)(((byte)(236)))), ((int)(((byte)(236)))));
			this.tbNuevoAlias.InputText = "";
			this.tbNuevoAlias.Location = new System.Drawing.Point(0, 0);
			this.tbNuevoAlias.MinimumSize = new System.Drawing.Size(20, 20);
			this.tbNuevoAlias.Multiline = false;
			this.tbNuevoAlias.Name = "tbNuevoAlias";
			this.tbNuevoAlias.PasswordChar = '\0';
			this.tbNuevoAlias.PercentualRadius = true;
			this.tbNuevoAlias.PlaceHolder = "Alias";
			this.tbNuevoAlias.PlaceHolderColor = System.Drawing.Color.FromArgb(((int)(((byte)(55)))), ((int)(((byte)(73)))), ((int)(((byte)(94)))));
			this.tbNuevoAlias.ReadOnly = false;
			this.tbNuevoAlias.SelectAllOnClick = true;
			this.tbNuevoAlias.Size = new System.Drawing.Size(234, 39);
			this.tbNuevoAlias.Style = ControLib.SleekTextBox.TextBoxStyle.RoundRect;
			this.tbNuevoAlias.TabIndex = 0;
			this.tbNuevoAlias.TextAlign = System.Windows.Forms.HorizontalAlignment.Left;
			this.tbNuevoAlias.WordWrap = true;
			// 
			// btnNuevoAlias
			// 
			this.btnNuevoAlias.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(27)))), ((int)(((byte)(35)))), ((int)(((byte)(44)))));
			this.btnNuevoAlias.BorderColor = System.Drawing.Color.FromArgb(((int)(((byte)(48)))), ((int)(((byte)(48)))), ((int)(((byte)(48)))));
			this.btnNuevoAlias.BorderRadius = 100F;
			this.btnNuevoAlias.BorderSize = 0F;
			this.btnNuevoAlias.Dock = System.Windows.Forms.DockStyle.Right;
			this.btnNuevoAlias.FlatAppearance.BorderSize = 0;
			this.btnNuevoAlias.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
			this.btnNuevoAlias.Font = new System.Drawing.Font("Arial Black", 16F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
			this.btnNuevoAlias.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(64)))), ((int)(((byte)(196)))), ((int)(((byte)(130)))));
			this.btnNuevoAlias.Location = new System.Drawing.Point(234, 0);
			this.btnNuevoAlias.Name = "btnNuevoAlias";
			this.btnNuevoAlias.PercentualRadius = true;
			this.btnNuevoAlias.Size = new System.Drawing.Size(39, 39);
			this.btnNuevoAlias.TabIndex = 1;
			this.btnNuevoAlias.Text = "+";
			this.btnNuevoAlias.TextAlign = System.Drawing.ContentAlignment.TopRight;
			this.btnNuevoAlias.UseVisualStyleBackColor = false;
			// 
			// pnlNombre
			// 
			this.pnlNombre.Controls.Add(this.tbNombre);
			this.pnlNombre.Controls.Add(this.lblNombre);
			this.pnlNombre.Dock = System.Windows.Forms.DockStyle.Top;
			this.pnlNombre.Location = new System.Drawing.Point(12, 8);
			this.pnlNombre.Name = "pnlNombre";
			this.pnlNombre.Padding = new System.Windows.Forms.Padding(0, 0, 0, 6);
			this.pnlNombre.Size = new System.Drawing.Size(273, 60);
			this.pnlNombre.TabIndex = 0;
			// 
			// tbNombre
			// 
			this.tbNombre.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(27)))), ((int)(((byte)(35)))), ((int)(((byte)(44)))));
			this.tbNombre.BorderColor = System.Drawing.Color.FromArgb(((int)(((byte)(48)))), ((int)(((byte)(48)))), ((int)(((byte)(48)))));
			this.tbNombre.BorderRadius = 100F;
			this.tbNombre.BorderSize = 0F;
			this.tbNombre.Cursor = System.Windows.Forms.Cursors.IBeam;
			this.tbNombre.Dock = System.Windows.Forms.DockStyle.Fill;
			this.tbNombre.FocusColor = System.Drawing.Color.Empty;
			this.tbNombre.Font = new System.Drawing.Font("Microsoft Sans Serif", 11F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
			this.tbNombre.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(236)))), ((int)(((byte)(236)))), ((int)(((byte)(236)))));
			this.tbNombre.InputColor = System.Drawing.Color.FromArgb(((int)(((byte)(236)))), ((int)(((byte)(236)))), ((int)(((byte)(236)))));
			this.tbNombre.InputText = "";
			this.tbNombre.Location = new System.Drawing.Point(0, 15);
			this.tbNombre.MinimumSize = new System.Drawing.Size(20, 20);
			this.tbNombre.Multiline = false;
			this.tbNombre.Name = "tbNombre";
			this.tbNombre.PasswordChar = '\0';
			this.tbNombre.PercentualRadius = true;
			this.tbNombre.PlaceHolder = "Nombre";
			this.tbNombre.PlaceHolderColor = System.Drawing.Color.FromArgb(((int)(((byte)(55)))), ((int)(((byte)(73)))), ((int)(((byte)(94)))));
			this.tbNombre.ReadOnly = false;
			this.tbNombre.SelectAllOnClick = true;
			this.tbNombre.Size = new System.Drawing.Size(273, 39);
			this.tbNombre.Style = ControLib.SleekTextBox.TextBoxStyle.RoundRect;
			this.tbNombre.TabIndex = 0;
			this.tbNombre.TextAlign = System.Windows.Forms.HorizontalAlignment.Left;
			this.tbNombre.WordWrap = true;
			// 
			// lblNombre
			// 
			this.lblNombre.AutoSize = true;
			this.lblNombre.Dock = System.Windows.Forms.DockStyle.Top;
			this.lblNombre.Font = new System.Drawing.Font("Lato Black", 9F);
			this.lblNombre.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(98)))), ((int)(((byte)(98)))), ((int)(((byte)(136)))));
			this.lblNombre.Location = new System.Drawing.Point(0, 0);
			this.lblNombre.Name = "lblNombre";
			this.lblNombre.Size = new System.Drawing.Size(60, 15);
			this.lblNombre.TabIndex = 1;
			this.lblNombre.Text = "NOMBRE";
			this.lblNombre.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
			// 
			// pnlTítuloMetadatos
			// 
			this.pnlTítuloMetadatos.AutoSize = true;
			this.pnlTítuloMetadatos.Controls.Add(this.lblMetadatos);
			this.pnlTítuloMetadatos.Dock = System.Windows.Forms.DockStyle.Top;
			this.pnlTítuloMetadatos.Location = new System.Drawing.Point(0, 0);
			this.pnlTítuloMetadatos.Name = "pnlTítuloMetadatos";
			this.pnlTítuloMetadatos.Size = new System.Drawing.Size(297, 45);
			this.pnlTítuloMetadatos.TabIndex = 3;
			// 
			// lblMetadatos
			// 
			this.lblMetadatos.AutoSize = true;
			this.lblMetadatos.Dock = System.Windows.Forms.DockStyle.Top;
			this.lblMetadatos.Font = new System.Drawing.Font("Segoe UI Black", 24F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
			this.lblMetadatos.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(159)))), ((int)(((byte)(39)))), ((int)(((byte)(39)))));
			this.lblMetadatos.Location = new System.Drawing.Point(0, 0);
			this.lblMetadatos.Name = "lblMetadatos";
			this.lblMetadatos.Size = new System.Drawing.Size(188, 45);
			this.lblMetadatos.TabIndex = 3;
			this.lblMetadatos.Text = "Metadatos";
			// 
			// btnGenerar
			// 
			this.btnGenerar.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Right)));
			this.btnGenerar.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(159)))), ((int)(((byte)(39)))), ((int)(((byte)(39)))));
			this.btnGenerar.BorderColor = System.Drawing.Color.FromArgb(((int)(((byte)(48)))), ((int)(((byte)(48)))), ((int)(((byte)(48)))));
			this.btnGenerar.BorderRadius = 12F;
			this.btnGenerar.BorderSize = 0F;
			this.btnGenerar.FlatAppearance.BorderSize = 0;
			this.btnGenerar.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
			this.btnGenerar.Font = new System.Drawing.Font("Segoe UI Semibold", 12F);
			this.btnGenerar.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(246)))), ((int)(((byte)(246)))), ((int)(((byte)(246)))));
			this.btnGenerar.Location = new System.Drawing.Point(558, 498);
			this.btnGenerar.Name = "btnGenerar";
			this.btnGenerar.PercentualRadius = false;
			this.btnGenerar.Size = new System.Drawing.Size(154, 34);
			this.btnGenerar.TabIndex = 3;
			this.btnGenerar.Text = "Generar";
			this.btnGenerar.UseVisualStyleBackColor = false;
			// 
			// pnlIdentificadores
			// 
			this.pnlIdentificadores.Controls.Add(this.tbNuevoIdentificador);
			this.pnlIdentificadores.Controls.Add(this.btnNuevoIdentificador);
			this.pnlIdentificadores.Controls.Add(this.lblIdentificadores);
			this.pnlIdentificadores.Dock = System.Windows.Forms.DockStyle.Top;
			this.pnlIdentificadores.Location = new System.Drawing.Point(12, 434);
			this.pnlIdentificadores.Name = "pnlIdentificadores";
			this.pnlIdentificadores.Padding = new System.Windows.Forms.Padding(0, 0, 0, 6);
			this.pnlIdentificadores.Size = new System.Drawing.Size(273, 60);
			this.pnlIdentificadores.TabIndex = 4;
			// 
			// tbNuevoIdentificador
			// 
			this.tbNuevoIdentificador.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(27)))), ((int)(((byte)(35)))), ((int)(((byte)(44)))));
			this.tbNuevoIdentificador.BorderColor = System.Drawing.Color.FromArgb(((int)(((byte)(48)))), ((int)(((byte)(48)))), ((int)(((byte)(48)))));
			this.tbNuevoIdentificador.BorderRadius = 100F;
			this.tbNuevoIdentificador.BorderSize = 0F;
			this.tbNuevoIdentificador.Cursor = System.Windows.Forms.Cursors.IBeam;
			this.tbNuevoIdentificador.Dock = System.Windows.Forms.DockStyle.Fill;
			this.tbNuevoIdentificador.FocusColor = System.Drawing.Color.Empty;
			this.tbNuevoIdentificador.Font = new System.Drawing.Font("Microsoft Sans Serif", 11F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
			this.tbNuevoIdentificador.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(236)))), ((int)(((byte)(236)))), ((int)(((byte)(236)))));
			this.tbNuevoIdentificador.InputColor = System.Drawing.Color.FromArgb(((int)(((byte)(236)))), ((int)(((byte)(236)))), ((int)(((byte)(236)))));
			this.tbNuevoIdentificador.InputText = "";
			this.tbNuevoIdentificador.Location = new System.Drawing.Point(0, 15);
			this.tbNuevoIdentificador.MinimumSize = new System.Drawing.Size(20, 20);
			this.tbNuevoIdentificador.Multiline = false;
			this.tbNuevoIdentificador.Name = "tbNuevoIdentificador";
			this.tbNuevoIdentificador.PasswordChar = '\0';
			this.tbNuevoIdentificador.PercentualRadius = true;
			this.tbNuevoIdentificador.PlaceHolder = "Identificador";
			this.tbNuevoIdentificador.PlaceHolderColor = System.Drawing.Color.FromArgb(((int)(((byte)(55)))), ((int)(((byte)(73)))), ((int)(((byte)(94)))));
			this.tbNuevoIdentificador.ReadOnly = false;
			this.tbNuevoIdentificador.SelectAllOnClick = true;
			this.tbNuevoIdentificador.Size = new System.Drawing.Size(234, 39);
			this.tbNuevoIdentificador.Style = ControLib.SleekTextBox.TextBoxStyle.RoundRect;
			this.tbNuevoIdentificador.TabIndex = 0;
			this.tbNuevoIdentificador.TextAlign = System.Windows.Forms.HorizontalAlignment.Left;
			this.tbNuevoIdentificador.WordWrap = true;
			// 
			// btnNuevoIdentificador
			// 
			this.btnNuevoIdentificador.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(23)))), ((int)(((byte)(35)))), ((int)(((byte)(48)))));
			this.btnNuevoIdentificador.BorderColor = System.Drawing.Color.FromArgb(((int)(((byte)(48)))), ((int)(((byte)(48)))), ((int)(((byte)(48)))));
			this.btnNuevoIdentificador.BorderRadius = 100F;
			this.btnNuevoIdentificador.BorderSize = 0F;
			this.btnNuevoIdentificador.Dock = System.Windows.Forms.DockStyle.Right;
			this.btnNuevoIdentificador.FlatAppearance.BorderSize = 0;
			this.btnNuevoIdentificador.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
			this.btnNuevoIdentificador.Font = new System.Drawing.Font("Arial Black", 16F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
			this.btnNuevoIdentificador.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(64)))), ((int)(((byte)(196)))), ((int)(((byte)(130)))));
			this.btnNuevoIdentificador.Location = new System.Drawing.Point(234, 15);
			this.btnNuevoIdentificador.Name = "btnNuevoIdentificador";
			this.btnNuevoIdentificador.PercentualRadius = true;
			this.btnNuevoIdentificador.Size = new System.Drawing.Size(39, 39);
			this.btnNuevoIdentificador.TabIndex = 1;
			this.btnNuevoIdentificador.Text = "+";
			this.btnNuevoIdentificador.TextAlign = System.Drawing.ContentAlignment.TopRight;
			this.btnNuevoIdentificador.UseVisualStyleBackColor = false;
			// 
			// lblIdentificadores
			// 
			this.lblIdentificadores.AutoSize = true;
			this.lblIdentificadores.Dock = System.Windows.Forms.DockStyle.Top;
			this.lblIdentificadores.Font = new System.Drawing.Font("Lato Black", 9F);
			this.lblIdentificadores.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(98)))), ((int)(((byte)(98)))), ((int)(((byte)(136)))));
			this.lblIdentificadores.Location = new System.Drawing.Point(0, 0);
			this.lblIdentificadores.Name = "lblIdentificadores";
			this.lblIdentificadores.Size = new System.Drawing.Size(116, 15);
			this.lblIdentificadores.TabIndex = 1;
			this.lblIdentificadores.Text = "IDENTIFICADORES";
			this.lblIdentificadores.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
			// 
			// Opción
			// 
			this.Opción.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
			dataGridViewCellStyle2.Font = new System.Drawing.Font("Lato Black", 8F);
			this.Opción.DefaultCellStyle = dataGridViewCellStyle2;
			this.Opción.FillWeight = 25F;
			this.Opción.HeaderText = "Opción";
			this.Opción.Name = "Opción";
			this.Opción.ReadOnly = true;
			// 
			// Nombre
			// 
			this.Nombre.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
			dataGridViewCellStyle3.Font = new System.Drawing.Font("Lato Black", 8F);
			this.Nombre.DefaultCellStyle = dataGridViewCellStyle3;
			this.Nombre.FillWeight = 45F;
			this.Nombre.HeaderText = "Nombre";
			this.Nombre.Name = "Nombre";
			this.Nombre.ReadOnly = true;
			// 
			// Tipo
			// 
			this.Tipo.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
			dataGridViewCellStyle4.Font = new System.Drawing.Font("Lato Black", 8F);
			this.Tipo.DefaultCellStyle = dataGridViewCellStyle4;
			this.Tipo.FillWeight = 30F;
			this.Tipo.HeaderText = "Tipo";
			this.Tipo.Name = "Tipo";
			this.Tipo.ReadOnly = true;
			// 
			// FPrincipal
			// 
			this.AutoScaleDimensions = new System.Drawing.SizeF(8F, 20F);
			this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
			this.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(26)))), ((int)(((byte)(26)))), ((int)(((byte)(26)))));
			this.ClientSize = new System.Drawing.Size(724, 544);
			this.Controls.Add(this.btnGenerar);
			this.Controls.Add(this.pnlMetadatos);
			this.Font = new System.Drawing.Font("Segoe UI", 11F);
			this.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(236)))), ((int)(((byte)(236)))), ((int)(((byte)(236)))));
			this.KeyPreview = true;
			this.Margin = new System.Windows.Forms.Padding(4, 5, 4, 5);
			this.MinimumSize = new System.Drawing.Size(490, 210);
			this.Name = "FPrincipal";
			this.ShowIcon = false;
			this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
			this.Text = "Command Builder";
			this.KeyPress += new System.Windows.Forms.KeyPressEventHandler(this.FPrincipal_KeyPress);
			this.pnlMetadatos.ResumeLayout(false);
			this.pnlMetadatos.PerformLayout();
			this.pnlContenidoMetadatos.ResumeLayout(false);
			this.pnlOpciones.ResumeLayout(false);
			this.pnlOpciones.PerformLayout();
			((System.ComponentModel.ISupportInitialize)(this.dgvOpciones)).EndInit();
			this.tlpBotonesOpciones.ResumeLayout(false);
			this.pnlDescripción.ResumeLayout(false);
			this.pnlDescripción.PerformLayout();
			this.pnlAlias.ResumeLayout(false);
			this.pnlNombre.ResumeLayout(false);
			this.pnlNombre.PerformLayout();
			this.pnlTítuloMetadatos.ResumeLayout(false);
			this.pnlTítuloMetadatos.PerformLayout();
			this.pnlIdentificadores.ResumeLayout(false);
			this.pnlIdentificadores.PerformLayout();
			this.ResumeLayout(false);

		}

		#endregion
		private System.Windows.Forms.Panel pnlMetadatos;
		private ControLib.SleekButton btnGenerar;
		private System.Windows.Forms.SaveFileDialog sflComando;
		private System.Windows.Forms.Panel pnlTítuloMetadatos;
		private System.Windows.Forms.Panel pnlContenidoMetadatos;
		private System.Windows.Forms.Label lblMetadatos;
		private System.Windows.Forms.Panel pnlNombre;
		private ControLib.SleekTextBox tbNombre;
		private System.Windows.Forms.Label lblNombre;
		private System.Windows.Forms.Panel pnlAlias;
		private ControLib.SleekTextBox tbNuevoAlias;
		private System.Windows.Forms.Panel pnlDescripción;
		private ControLib.SleekTextBox tbDescripción;
		private System.Windows.Forms.Label lblDescripción;
		private ControLib.SleekButton btnNuevoAlias;
		private System.Windows.Forms.Panel pnlOpciones;
		private System.Windows.Forms.Label lblOpciones;
		private System.Windows.Forms.TableLayoutPanel tlpBotonesOpciones;
		private ControLib.SleekButton btnAgregarParámetro;
		private ControLib.SleekButton btnAgregarBandera;
		private System.Windows.Forms.DataGridView dgvOpciones;
		private System.Windows.Forms.Panel pnlIdentificadores;
		private ControLib.SleekTextBox tbNuevoIdentificador;
		private ControLib.SleekButton btnNuevoIdentificador;
		private System.Windows.Forms.Label lblIdentificadores;
		private System.Windows.Forms.DataGridViewTextBoxColumn Opción;
		private System.Windows.Forms.DataGridViewTextBoxColumn Nombre;
		private System.Windows.Forms.DataGridViewTextBoxColumn Tipo;
	}
}

